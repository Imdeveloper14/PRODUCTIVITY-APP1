import { NextResponse } from 'next/server';
import { getBootstrapDiagnostics } from '../../../utils/authBootstrap';

export async function GET() {
  const diagnostics = await getBootstrapDiagnostics();
  return NextResponse.json({
    success: true,
    diagnostics
  });
}
