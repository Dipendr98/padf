# Simple HTTP Server for Smart PDF Reader
$port = 8080
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Prefixes.Add("http://127.0.0.1:$port/")

try {
    $listener.Start()
    Write-Host "Server running at http://127.0.0.1:$port"
    Write-Host "Press Ctrl+C to stop"

    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $path = $request.Url.LocalPath
        if ($path -eq "/" -or $path -eq "") { 
            $path = "/app.html" 
        }
        
        $localPath = Join-Path (Get-Location).Path $path.TrimStart("/")
        
        if ((Test-Path $localPath) -and -not (Test-Path $localPath -PathType Container)) {
            $bytes = [System.IO.File]::ReadAllBytes($localPath)
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $message = "404 - File Not Found"
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($message)
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        }
        
        $response.OutputStream.Close()
    }
}
catch {
    Write-Host "Error: $_"
}
finally {
    if ($listener) {
        $listener.Stop()
        $listener.Close()
    }
}
