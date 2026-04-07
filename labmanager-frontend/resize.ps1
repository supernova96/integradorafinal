Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile('public\icono3.jpeg')
$bmp192 = New-Object System.Drawing.Bitmap($img, 192, 192)
$bmp192.Save('public\pwa-192x192.png', [System.Drawing.Imaging.ImageFormat]::Png)
$bmp512 = New-Object System.Drawing.Bitmap($img, 512, 512)
$bmp512.Save('public\pwa-512x512.png', [System.Drawing.Imaging.ImageFormat]::Png)
$img.Dispose()
$bmp192.Dispose()
$bmp512.Dispose()
