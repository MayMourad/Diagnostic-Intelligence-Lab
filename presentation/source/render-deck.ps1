# Generic deck renderer: reads a JSON slide description (UTF-8) and builds a .pptx with PowerPoint COM automation.
# ASCII-only on purpose (Windows PowerShell 5.1 mis-reads BOM-less UTF-8 scripts); all text lives in the JSON.
param(
  [Parameter(Mandatory = $true)][string]$SpecPath,
  [Parameter(Mandatory = $true)][string]$Out,
  [string]$PngDir = ''
)
$ErrorActionPreference = 'Stop'
function RGBInt([string]$hex) { $r = [Convert]::ToInt32($hex.Substring(0, 2), 16); $g = [Convert]::ToInt32($hex.Substring(2, 2), 16); $b = [Convert]::ToInt32($hex.Substring(4, 2), 16); return $r + ($g * 256) + ($b * 65536) }
$SpecPath = (Resolve-Path -LiteralPath $SpecPath).Path
$RepoRoot = (Resolve-Path (Join-Path (Split-Path $SpecPath -Parent) '..')).Path
if (-not [System.IO.Path]::IsPathRooted($Out)) { $Out = Join-Path (Get-Location).Path $Out }
if ($PngDir -ne '' -and -not [System.IO.Path]::IsPathRooted($PngDir)) { $PngDir = Join-Path (Get-Location).Path $PngDir }
$spec = Get-Content -LiteralPath $SpecPath -Raw -Encoding UTF8 | ConvertFrom-Json
$app = New-Object -ComObject PowerPoint.Application
$pres = $app.Presentations.Add(0)
$pres.PageSetup.SlideWidth = $spec.width
$pres.PageSetup.SlideHeight = $spec.height
$blank = $null
foreach ($l in $pres.SlideMaster.CustomLayouts) { if ($l.Name -eq 'Blank') { $blank = $l } }
if ($null -eq $blank) { $blank = $pres.SlideMaster.CustomLayouts.Item(7) }
$warnings = @()
$n = 0
foreach ($sd in $spec.slides) {
  $n++
  $slide = $pres.Slides.AddSlide($n, $blank)
  $slide.FollowMasterBackground = 0
  $slide.Background.Fill.Solid()
  $slide.Background.Fill.ForeColor.RGB = (RGBInt $sd.bg)
  foreach ($e in $sd.elements) {
    try {
    switch ($e.type) {
      'rect' {
        $s = $slide.Shapes.AddShape(1, $e.x, $e.y, $e.w, $e.h)
        $s.Fill.ForeColor.RGB = (RGBInt $e.fill)
        if ($e.PSObject.Properties.Name -contains 'transparency') { $s.Fill.Transparency = $e.transparency }
        if ($e.PSObject.Properties.Name -contains 'line') { $s.Line.Visible = -1; $s.Line.ForeColor.RGB = (RGBInt $e.line); $s.Line.Weight = 0.75; if ($e.PSObject.Properties.Name -contains 'dash') { $s.Line.DashStyle = 4 } } else { $s.Line.Visible = 0 }
        if ($e.PSObject.Properties.Name -contains 'noFill') { $s.Fill.Visible = 0 }
        $s.Name = $e.name
        $s.Shadow.Visible = 0
      }
      'ellipse' {
        $s = $slide.Shapes.AddShape(9, $e.x, $e.y, $e.w, $e.h)
        $s.Fill.ForeColor.RGB = (RGBInt $e.fill); $s.Line.Visible = 0; $s.Name = $e.name; $s.Shadow.Visible = 0
      }
      'line' {
        $s = $slide.Shapes.AddLine($e.x1, $e.y1, $e.x2, $e.y2)
        $s.Line.ForeColor.RGB = (RGBInt $e.color); $s.Line.Weight = $e.weight; $s.Name = $e.name
        if ($e.PSObject.Properties.Name -contains 'dash') { $s.Line.DashStyle = 4 }
      }
      'img' {
        $imgPath = $e.path; if (-not [System.IO.Path]::IsPathRooted($imgPath)) { $imgPath = Join-Path $RepoRoot $imgPath }
        $s = $slide.Shapes.AddPicture($imgPath, 0, -1, 0, 0, -1, -1)
        $w0 = [double]$s.Width; $h0 = [double]$s.Height
        $cl = 0.0; $cr = 0.0; $ct = 0.0; $cb = 0.0
        if ($e.PSObject.Properties.Name -contains 'crop') { $cl = [double]$e.crop.l; $cr = [double]$e.crop.r; $ct = [double]$e.crop.t; $cb = [double]$e.crop.b }
        $scale = [double]$e.w / ((1 - $cl - $cr) * $w0)
        $shapeH = (1 - $ct - $cb) * $h0 * $scale
        if ($shapeH -gt [double]$e.hmax) { $scale = $scale * ([double]$e.hmax / $shapeH); $shapeH = [double]$e.hmax }
        $shapeW = (1 - $cl - $cr) * $w0 * $scale
        $pw = $w0 * $scale; $ph = $h0 * $scale
        $s.LockAspectRatio = 0
        $c = $s.PictureFormat.Crop
        $c.PictureWidth = [single]$pw; $c.PictureHeight = [single]$ph
        $c.ShapeWidth = [single]$shapeW; $c.ShapeHeight = [single]$shapeH
        $c.PictureOffsetX = [single]($pw / 2 - $cl * $pw - $shapeW / 2)
        $c.PictureOffsetY = [single]($ph / 2 - $ct * $ph - $shapeH / 2)
        $s.Left = [single]$e.x; $s.Top = [single]$e.y
        if ($e.PSObject.Properties.Name -contains 'border') { $s.Line.Visible = -1; $s.Line.ForeColor.RGB = (RGBInt $e.border); $s.Line.Weight = 0.75 }
        $s.AlternativeText = $e.alt
        $s.Name = $e.name
        if (($s.Left + $s.Width) -gt ($spec.width + 0.5) -or ($s.Top + $s.Height) -gt ($spec.height + 0.5)) { $warnings += "slide $n image $($e.name) leaves the slide" }
      }
      'text' {
        $s = $slide.Shapes.AddTextbox(1, $e.x, $e.y, $e.w, $e.h)
        $tf = $s.TextFrame
        $tf.WordWrap = -1; $tf.AutoSize = 0
        $tf.MarginLeft = 0; $tf.MarginRight = 0; $tf.MarginTop = 0; $tf.MarginBottom = 0
        $s.Height = $e.h
        $tf.VerticalAnchor = 1
        if ($e.PSObject.Properties.Name -contains 'anchor') { $tf.VerticalAnchor = $e.anchor }
        $paras = @($e.paras)
        $text = ($paras | ForEach-Object { ($_.runs | ForEach-Object { $_.t }) -join '' }) -join "`r"
        $tf.TextRange.Text = $text
        $tr = $tf.TextRange
        $tr.Font.Name = $e.font; $tr.Font.Size = $e.size; $tr.Font.Color.RGB = (RGBInt $e.color)
        if ($e.PSObject.Properties.Name -contains 'bold') { $tr.Font.Bold = [int]$e.bold }
        if ($e.PSObject.Properties.Name -contains 'italic') { $tr.Font.Italic = [int]$e.italic }
        $align = 1; if ($e.PSObject.Properties.Name -contains 'align') { $align = $e.align }
        $tr.ParagraphFormat.Alignment = $align
        $sw = 1.0; if ($e.PSObject.Properties.Name -contains 'lineSpacing') { $sw = $e.lineSpacing }
        $tr.ParagraphFormat.LineRuleWithin = -1; $tr.ParagraphFormat.SpaceWithin = [single]$sw
        $sa = 0; if ($e.PSObject.Properties.Name -contains 'spaceAfter') { $sa = $e.spaceAfter }
        $tr.ParagraphFormat.LineRuleAfter = 0; $tr.ParagraphFormat.SpaceAfter = [single]$sa
        $pos = 1
        for ($i = 0; $i -lt $paras.Count; $i++) {
          $p = $paras[$i]
          $pr = $tf.TextRange.Paragraphs($i + 1)
          if ($p.PSObject.Properties.Name -contains 'bullet' -and $p.bullet) {
            $pr.ParagraphFormat.Bullet.Visible = -1; $pr.ParagraphFormat.Bullet.Type = 1; $pr.ParagraphFormat.Bullet.Character = 8226
            $pr.ParagraphFormat.Bullet.Font.Color.RGB = (RGBInt $e.color)
            $pr.Parent.Ruler.Levels(1).FirstMargin = 0; $pr.Parent.Ruler.Levels(1).LeftMargin = 14
          }
          foreach ($r in $p.runs) {
            $len = $r.t.Length
            if ($len -gt 0) {
              $ch = $tf.TextRange.Characters($pos, $len)
              if ($r.PSObject.Properties.Name -contains 'bold') { $ch.Font.Bold = [int]$r.bold }
              if ($r.PSObject.Properties.Name -contains 'italic') { $ch.Font.Italic = [int]$r.italic }
              if ($r.PSObject.Properties.Name -contains 'color') { $ch.Font.Color.RGB = (RGBInt $r.color) }
              if ($r.PSObject.Properties.Name -contains 'font') { $ch.Font.Name = $r.font }
              if ($r.PSObject.Properties.Name -contains 'size') { $ch.Font.Size = $r.size }
            }
            $pos += $len
          }
          $pos += 1
        }
        $s.Name = $e.name
        $bh = $tf.TextRange.BoundHeight
        if ($bh -gt ($e.h + 1)) { $warnings += ("slide {0} text '{1}' overflows: needs {2:N0}pt, box {3:N0}pt" -f $n, $e.name, $bh, $e.h) }
      }
    }
    } catch { $warnings += ("slide {0} element {1} FAILED: {2} [line {3}] {4}" -f $n, $e.name, $_.Exception.Message, $_.InvocationInfo.ScriptLineNumber, $_.InvocationInfo.Line.Trim()) }
  }
  if ($sd.PSObject.Properties.Name -contains 'notes') { $slide.NotesPage.Shapes.Placeholders(2).TextFrame.TextRange.Text = $sd.notes }
}
try { $pres.BuiltInDocumentProperties.Item('Title').Value = 'Diagnostic Intelligence Lab (provisional title)'; $pres.BuiltInDocumentProperties.Item('Author').Value = 'Diagnostic Intelligence Lab student team'; $pres.BuiltInDocumentProperties.Item('Company').Value = '' } catch { }
$pres.SaveAs($Out)
if ($PngDir -ne '') {
  New-Item -ItemType Directory -Force -Path $PngDir | Out-Null
  $i = 0
  foreach ($sl in $pres.Slides) { $i++; $sl.Export((Join-Path $PngDir ("slide-{0:D2}.png" -f $i)), 'PNG', 1920, 1080) }
}
$pres.Close()
$app.Quit()
# Office stamps the signed-in user as lastModifiedBy; replace it so no personal account name ships in the file.
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::Open($Out, 'Update')
try {
  $entry = $zip.GetEntry('docProps/core.xml')
  $rd = New-Object System.IO.StreamReader($entry.Open()); $xml = $rd.ReadToEnd(); $rd.Close()
  $xml = [regex]::Replace($xml, '<cp:lastModifiedBy>.*?</cp:lastModifiedBy>', '<cp:lastModifiedBy>Diagnostic Intelligence Lab student team</cp:lastModifiedBy>')
  $xml = [regex]::Replace($xml, '<dc:creator>.*?</dc:creator>', '<dc:creator>Diagnostic Intelligence Lab student team</dc:creator>')
  $entry.Delete()
  $new = $zip.CreateEntry('docProps/core.xml'); $wr = New-Object System.IO.StreamWriter($new.Open(), (New-Object System.Text.UTF8Encoding($false))); $wr.Write($xml); $wr.Close()
} finally { $zip.Dispose() }
if ($warnings.Count -gt 0) { Write-Output 'LAYOUT WARNINGS:'; $warnings | ForEach-Object { Write-Output ("  " + $_) } } else { Write-Output 'no layout warnings' }
Write-Output ("saved " + $Out)
