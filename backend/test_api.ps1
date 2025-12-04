$baseUrl = "http://localhost:3000/api"

# Login
$loginBody = @{
    email = "admin@example.com"
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "Token obtained."
} catch {
    Write-Host "Login Failed"
    Write-Host $_
    exit
}

# Get Categories
try {
    $catResponse = Invoke-RestMethod -Uri "$baseUrl/categories" -Method Get -Headers @{ Authorization = "Bearer $token" }
    if ($catResponse.Count -eq 0) {
        Write-Host "No categories found."
        exit
    }
    $categoryId = $catResponse[0].id
    Write-Host "Category ID: $categoryId"
} catch {
    Write-Host "Get Categories Failed"
    Write-Host $_
    exit
}

# Create Q&A
$qnaBody = @{
    question_title = "PowerShell Test Question"
    question_details = "Testing from PowerShell"
    answer = "It works"
    categories = @($categoryId)
    tags = @("ps-test")
} | ConvertTo-Json

try {
    $createResponse = Invoke-RestMethod -Uri "$baseUrl/qna" -Method Post -Body $qnaBody -ContentType "application/json" -Headers @{ Authorization = "Bearer $token" }
    Write-Host "Q&A Created Successfully. ID: $($createResponse.id)"
} catch {
    Write-Host "Error creating Q&A:"
    Write-Host $_.Exception.Response.StatusCode.value__
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        if ($stream) {
            $reader = New-Object System.IO.StreamReader($stream)
            Write-Host $reader.ReadToEnd()
        }
    }
}
