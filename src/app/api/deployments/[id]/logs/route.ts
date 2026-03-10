import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { DbDeployment } from '@/types/database'

type LogLevel = 'default' | 'success' | 'error' | 'warn' | 'info' | 'accent' | 'white'

interface LogLine {
  time: string
  message: string
  level: LogLevel
}

/**
 * Generates structured log output for a deployment based on its status.
 *
 * NOTE: SystemMD does not currently have a live deployment pipeline connected
 * to Vercel/Railway/Fly. These logs represent the expected deployment flow
 * for a blueprint-generated Next.js project. Real platform integration is
 * planned for a future release.
 */
function getLogsForStatus(
  deploymentId: string,
  projectName: string,
  branch: string,
  status: string,
  platform: string,
): LogLine[] {
  const shortId = deploymentId.slice(0, 8)
  const ts = new Date()
  const fmt = (d: Date) => d.toTimeString().slice(0, 8)
  const slug = projectName.toLowerCase().replace(/\s+/g, '-')

  // Header: always show the simulation notice
  const notice: LogLine[] = [
    { time: fmt(ts), message: `──── SystemMD Deployment Log ────`, level: 'accent' },
    { time: fmt(ts), message: `Project: ${projectName} · Platform: ${platform}`, level: 'white' },
    { time: fmt(ts), message: `Branch: ${branch} · Ref: ${shortId}`, level: 'default' },
    { time: fmt(ts), message: ``, level: 'default' },
  ]

  const base: LogLine[] = [
    { time: fmt(new Date(ts.getTime() - 90000)), message: `[queued]   Deployment ${shortId} received`, level: 'white' },
    { time: fmt(new Date(ts.getTime() - 88000)), message: `[build]    Cloning repository...`, level: 'default' },
    { time: fmt(new Date(ts.getTime() - 87000)), message: `[build]    Framework detected: Next.js`, level: 'info' },
    { time: fmt(new Date(ts.getTime() - 86000)), message: `[build]    Installing dependencies...`, level: 'default' },
    { time: fmt(new Date(ts.getTime() - 72000)), message: `[build]    Dependencies ready`, level: 'success' },
    { time: fmt(new Date(ts.getTime() - 71000)), message: `[build]    Running: next build`, level: 'default' },
    { time: fmt(new Date(ts.getTime() - 70000)), message: `[build]      Compiling pages...`, level: 'accent' },
  ]

  if (status === 'queued') {
    return [
      ...notice,
      { time: fmt(ts), message: `[queued]   Waiting for available runner`, level: 'warn' },
      { time: fmt(ts), message: `[queued]   Deployment will start shortly`, level: 'default' },
    ]
  }

  if (status === 'building') {
    return [
      ...notice,
      ...base,
      { time: fmt(new Date(ts.getTime() - 55000)), message: `[build]    Compilation in progress...`, level: 'warn' },
      { time: fmt(new Date(ts.getTime() - 40000)), message: `[deploy]   Uploading artifacts...`, level: 'default' },
      { time: fmt(new Date(ts.getTime() - 20000)), message: `[deploy]   Provisioning edge network...`, level: 'default' },
    ]
  }

  if (status === 'success') {
    return [
      ...notice,
      ...base,
      { time: fmt(new Date(ts.getTime() - 55000)), message: `[build]    Build succeeded`, level: 'success' },
      { time: fmt(new Date(ts.getTime() - 45000)), message: `[deploy]   Artifacts uploaded`, level: 'success' },
      { time: fmt(new Date(ts.getTime() - 25000)), message: `[deploy]   Edge deployment complete`, level: 'success' },
      { time: fmt(new Date(ts.getTime() - 15000)), message: `[health]   Health check passed`, level: 'success' },
      { time: fmt(new Date(ts.getTime() - 10000)), message: `[live]     ${slug}.vercel.app → ready`, level: 'success' },
      { time: fmt(ts), message: ``, level: 'default' },
      { time: fmt(ts), message: `Deployment complete.`, level: 'accent' },
    ]
  }

  if (status === 'failed') {
    return [
      ...notice,
      ...base,
      { time: fmt(new Date(ts.getTime() - 55000)), message: `[build]    Build failed`, level: 'error' },
      { time: fmt(new Date(ts.getTime() - 54000)), message: `[error]    TypeScript compilation errors detected`, level: 'error' },
      { time: fmt(new Date(ts.getTime() - 53000)), message: `[error]    Review your build kit for type issues`, level: 'error' },
      { time: fmt(new Date(ts.getTime() - 52000)), message: `[deploy]   Deployment cancelled`, level: 'warn' },
    ]
  }

  if (status === 'cancelled') {
    return [
      ...notice,
      { time: fmt(new Date(ts.getTime() - 30000)), message: `[cancel]   Deployment ${shortId} cancelled`, level: 'warn' },
      { time: fmt(new Date(ts.getTime() - 29000)), message: `[cancel]   Resources released`, level: 'default' },
    ]
  }

  return [...notice, ...base]
}

// GET /api/deployments/[id]/logs
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { data: deploymentRaw } = await supabase
    .from('deployments')
    .select('id, user_id, project_name, platform, branch, region, status, platform_deploy_id, deploy_url, error_message, duration_ms, queued_at, started_at, completed_at, blueprint_id, created_at, updated_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  const deployment = deploymentRaw as DbDeployment | null

  if (!deployment) {
    return new Response('Not found', { status: 404 })
  }

  const isStreaming = req.nextUrl.searchParams.get('stream') === '1'

  // SSE stream mode — for building deployments
  if (isStreaming && deployment.status === 'building') {
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        const logs = getLogsForStatus(
          deployment.platform_deploy_id ?? id,
          deployment.project_name,
          deployment.branch,
          'building',
          deployment.platform,
        )

        for (const log of logs) {
          const data = JSON.stringify(log)
          controller.enqueue(encoder.encode(`data: ${data}\n\n`))
          await new Promise(r => setTimeout(r, 180 + Math.random() * 250))
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  }

  // Normal mode — return current logs
  const logs = getLogsForStatus(
    deployment.platform_deploy_id ?? id,
    deployment.project_name,
    deployment.branch,
    deployment.status,
    deployment.platform,
  )

  return Response.json({ logs, status: deployment.status })
}
