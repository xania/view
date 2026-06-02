param(
  [string]$Project = "kitchensink",
  [string]$VercelVersion = "54.7.1"
)

$ErrorActionPreference = "Stop"

$PackageDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path (Join-Path $PackageDir "../..")
$OutputDir = Join-Path $PackageDir ".vercel/output"
$StaticDir = Join-Path $OutputDir "static"
$DistDir = Join-Path $PackageDir "dist"

Push-Location $RepoRoot
try {
  pnpm --filter "@xania/kitchensink" build
} finally {
  Pop-Location
}

if (Test-Path $OutputDir) {
  Remove-Item -Recurse -Force $OutputDir
}

New-Item -ItemType Directory -Force -Path $StaticDir | Out-Null
Copy-Item -Recurse -Force (Join-Path $DistDir "*") $StaticDir
Set-Content -Path (Join-Path $OutputDir "config.json") -Value '{"version":3}' -NoNewline

Remove-Item -Recurse -Force (Join-Path $StaticDir ".vercel") -ErrorAction SilentlyContinue
Remove-Item -Force (Join-Path $StaticDir ".gitignore") -ErrorAction SilentlyContinue

Push-Location $PackageDir
try {
  npx "vercel@$VercelVersion" deploy --prebuilt --prod --yes --project $Project
} finally {
  Pop-Location
}
