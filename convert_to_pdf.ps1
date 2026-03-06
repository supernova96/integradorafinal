
$word = New-Object -ComObject Word.Application
$word.Visible = $false

$doc1 = $word.Documents.Open("C:\Users\feros\Downloads\integradora\Estrategias_de_Despliegue.docx")
$pdf1 = "C:\Users\feros\Downloads\integradora\Estrategias_de_Despliegue.pdf"
$doc1.SaveAs([ref] $pdf1, [ref] 17)
$doc1.Close()

$doc2 = $word.Documents.Open("C:\Users\feros\Downloads\integradora\Flujo_Pipeline_CICD.docx")
$pdf2 = "C:\Users\feros\Downloads\integradora\Flujo_Pipeline_CICD.pdf"
$doc2.SaveAs([ref] $pdf2, [ref] 17)
$doc2.Close()

$word.Quit()
