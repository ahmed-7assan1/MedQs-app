Get-ChildItem -Path "src\app\api\mobile" -Filter "route.ts" -Recurse | ForEach-Object {
  $content = Get-Content $_.FullName -Raw
  $fixed = $content -replace "import \{ db \} from '@/lib/db';", "import { prisma } from '@/lib/prisma';"
  $fixed = $fixed -replace "\bdb\.", "prisma."
  Set-Content -Path $_.FullName -Value $fixed -NoNewline
}
Write-Host "Done fixing imports"
