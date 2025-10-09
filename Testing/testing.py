import httpx, ssl, certifi

url = "https://ejir-test.fa.us6.oraclecloud.com/xmlpserver/services/ExternalReportWSSService?wsdl"
username = "vikas.sharma@smarterp.com"
password = "Vik@s#2024"

# SOAP request payload
soap_body = """<ns0:Envelope xmlns:ns0="http://www.w3.org/2003/05/soap-envelope" xmlns:ns1="http://xmlns.oracle.com/oxp/service/PublicReportService" xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:pub="http://xmlns.oracle.com/oxp/service/PublicReportService">
<ns0:Header/>
<ns0:Body>
<ns1:runReport>
<ns1:reportRequest>
<ns1:attributeFormat>xlsx</ns1:attributeFormat>
<ns1:reportAbsolutePath>/Custom/Human Capital Management/SERP Data Loader Tool/HDL Tool Reports/HDL_BO_LKP_VS_SETUPS_Report V2.xdo</ns1:reportAbsolutePath>
<ns1:sizeOfDataChunkDownload>-1</ns1:sizeOfDataChunkDownload>
</ns1:reportRequest>
</ns1:runReport>
</ns0:Body>
</ns0:Envelope>
"""

ctx = ssl.create_default_context(cafile=certifi.where())
ctx.minimum_version = ssl.TLSVersion.TLSv1_2

headers = {
    "Content-Type": 'application/soap+xml;charset=UTF-8;action="runReport"'
}

with httpx.Client(verify=ctx, auth=(username, password), http2=False, timeout=90.0) as client:
    resp = client.post(url, content=soap_body, headers=headers)
    print("Status:", resp.status_code)
    print("Response:", resp.text[:1000])





# Ask her to open in cmd itself..