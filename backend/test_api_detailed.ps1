$baseUrl = "http://localhost:3000/api"

# Login
$loginBody = @{
    email = "admin@example.com"
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "Login successful. Token: $($token.Substring(0,20))..."
} catch {
    Write-Host "Login Failed:"
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails) {
        Write-Host $_.ErrorDetails.Message
    }
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
    Write-Host "Get Categories Failed:"
    Write-Host $_.Exception.Message
    exit
}

# Create Q&A
$qnaBody = @{
    question_title = "Direct API Test"
    question_details = "Testing from PowerShell directly"
    answer = "Direct test answer"
    categories = @($categoryId)
    tags = @("direct-test")
} | ConvertTo-Json

Write-Host "Sending request body:"
Write-Host $qnaBody

try {
    $createResponse = Invoke-RestMethod -Uri "$baseUrl/qna" -Method Post -Body $qnaBody -ContentType "application/json" -Headers @{ Authorization = "Bearer $token" } -Verbose
    Write-Host "Q&A Created Successfully:"
    Write-Host ($createResponse | ConvertTo-Json)
} catch {
    Write-Host "Error creating Q&A:"
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)"
    Write-Host "Message: $($_.Exception.Message)"
    if ($_.ErrorDetails) {
        Write-Host "Details: $($_.ErrorDetails.Message)"
    }
    # Try to get response stream
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        if ($stream) {
            $reader = New-Object System.IO.StreamReader($stream)
            $respBody = $reader.ReadToEnd()
            Write-Host "Response Body: $respBody"
        }
    }
}
