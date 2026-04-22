$patterns = @{
    "border-white/10" = "border-white/[0.03]"
    "border-white/20" = "border-white/[0.04]"
    "border-white/30" = "border-white/[0.05]"
    "border-white/5"  = "border-white/[0.02]"
    "border-border/10" = "border-white/[0.01]"
    "border-border/20" = "border-white/[0.01]"
    "border-border/30" = "border-white/[0.02]"
    "border-border/40" = "border-white/[0.02]"
    "border-border/50" = "border-white/[0.02]"
    "border-border/60" = "border-white/[0.02]"
    "border-border/70" = "border-white/[0.03]"
    "border-border/80" = "border-white/[0.03]"
    "border-border/90" = "border-white/[0.04]"
}

Get-ChildItem -Path src -Filter *.tsx -Recurse | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $changed = $false
    
    foreach ($pattern in $patterns.Keys) {
        if ($content -match [regex]::Escape($pattern)) {
            $content = $content -replace [regex]::Escape($pattern), $patterns[$pattern]
            $changed = $true
        }
    }
    
    if ($changed) {
        Write-Host "Updating $($_.FullName)"
        $content | Set-Content $_.FullName
    }
}
