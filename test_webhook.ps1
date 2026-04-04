[CmdletBinding()]
param()

$body = '{
  "event_id": "msg-test3",
  "event_type": "response_ready",
  "agent_slug": "antigravity-agent",
  "external_thread_id": "web-123456789",
  "timestamp": "' + (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ") + '",
  "message": {
    "external_message_id": "msg-test3",
    "sender_type": "agent",
    "sender_label": "Antigravity Agent",
    "content": "Estou enviando esta mensagem de teste agora. Pode confirmar se recebeu?",
    "content_format": "text"
  }
}'

$secret = "MSJnshvu1n_28cdf6hJSN_298SNhduNCH1"
$hmac = New-Object System.Security.Cryptography.HMACSHA256
$hmac.Key = [Text.Encoding]::UTF8.GetBytes($secret)
$hash = $hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes($body))
$sig = "sha256=" + ([BitConverter]::ToString($hash) -replace '-','').ToLower()

$headers = @{"x-webhook-signature"=$sig}
$bytes = [System.Text.Encoding]::UTF8.GetBytes($body)

Write-Host "Sending to Localhost..."
try {
    $resLocal = Invoke-RestMethod -Uri "http://localhost:3000/api/webhooks/antigravity" -Method POST -ContentType "application/json; charset=utf-8" -Headers $headers -Body $bytes -ErrorAction Stop
    Write-Host "Localhost SUCCESS: $($resLocal | ConvertTo-Json -Compress)"
} catch {
    Write-Host "Localhost FAILED: $_"
}

Write-Host "Sending to Production..."
try {
    $resProd = Invoke-RestMethod -Uri "https://antigravity-web-chat.vercel.app/api/webhooks/antigravity" -Method POST -ContentType "application/json; charset=utf-8" -Headers $headers -Body $bytes -ErrorAction Stop
    Write-Host "Production SUCCESS: $($resProd | ConvertTo-Json -Compress)"
} catch {
    Write-Host "Production FAILED: $_"
}
