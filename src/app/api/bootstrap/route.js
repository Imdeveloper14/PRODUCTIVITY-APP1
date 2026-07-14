import { NextResponse } from 'next/server';
import { runBootstrap, getBootstrapDiagnostics } from '../../utils/authBootstrap';

export async function GET() {
  const diagnostics = await getBootstrapDiagnostics();
  return NextResponse.json({ success: true, diagnostics });
}

export async function POST() {
  const result = await runBootstrap();
  return NextResponse.json({ success: result.ok, result });
}
