"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { QrCode, Download, Copy, Check } from "lucide-react"

interface Restaurant {
  id: string
  name: string
}

export default function QRCodeGenerator({ restaurant }: { restaurant: Restaurant }) {
  const [tableNumber, setTableNumber] = useState("1")
  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const [menuUrl, setMenuUrl] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (restaurant && tableNumber) {
      const baseUrl = window.location.origin
      const url = `${baseUrl}/menu/${restaurant.id}?table=${tableNumber}`
      setMenuUrl(url)
      // Generate QR code using a free service
      setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`)
    }
  }, [restaurant, tableNumber])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(menuUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  const downloadQRCode = async () => {
    try {
      const response = await fetch(qrCodeUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `table-${tableNumber}-qr-code.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Failed to download QR code:", error)
    }
  }

  const printQRCode = () => {
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Code - Table ${tableNumber}</title>
            <style>
              body { 
                margin: 0; 
                padding: 20px; 
                font-family: Arial, sans-serif; 
                text-align: center;
                background: white;
              }
              .qr-container { 
                display: inline-block; 
                padding: 20px; 
                border: 2px dashed #ccc; 
                border-radius: 8px;
                background: white;
              }
              img { 
                display: block; 
                margin: 0 auto 16px auto; 
              }
              .restaurant-info {
                color: #666;
                font-size: 14px;
              }
              .restaurant-name {
                font-weight: bold;
                margin-bottom: 4px;
              }
              .scan-text {
                font-size: 12px;
                margin-top: 8px;
              }
              @media print {
                body { margin: 0; padding: 10px; }
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <img src="${qrCodeUrl}" alt="QR Code for Table ${tableNumber}" />
              <div class="restaurant-info">
                <div class="restaurant-name">${restaurant.name}</div>
                <div>Table ${tableNumber}</div>
                <div class="scan-text">Scan to view menu & order</div>
              </div>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 250)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* QR Code Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Generate QR Code</CardTitle>
          <CardDescription>Create QR codes for different tables in your restaurant</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="tableNumber">Table Number</Label>
            <Input
              id="tableNumber"
              type="text"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="Enter table number"
            />
          </div>

          <div className="space-y-2">
            <Label>Menu URL</Label>
            <div className="flex space-x-2">
              <Input value={menuUrl} readOnly className="bg-gray-50" />
              <Button onClick={copyToClipboard} variant="outline" size="sm">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-gray-500">Customers will scan the QR code to access this URL</p>
          </div>

          <div className="pt-4 border-t">
            <h3 className="font-medium text-gray-900 mb-2">Instructions for Use:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Print the QR code and place it on the table</li>
              <li>• Customers scan with their phone camera</li>
              <li>• They'll see your menu and can place orders</li>
              <li>• Orders appear in your dashboard instantly</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* QR Code Preview */}
      <Card>
        <CardHeader>
          <CardTitle>QR Code Preview</CardTitle>
          <CardDescription>
            Table {tableNumber} - {restaurant.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          {qrCodeUrl && (
            <div className="bg-white p-8 rounded-lg border-2 border-dashed border-gray-300 inline-block">
              <img
                src={qrCodeUrl || "/placeholder.svg"}
                alt={`QR Code for Table ${tableNumber}`}
                className="mx-auto mb-4"
              />
              <div className="text-sm text-gray-600">
                <p className="font-medium">{restaurant.name}</p>
                <p>Table {tableNumber}</p>
                <p className="text-xs mt-2">Scan to view menu & order</p>
              </div>
            </div>
          )}

          <div className="flex justify-center space-x-3">
            <Button onClick={downloadQRCode} className="bg-blue-600 hover:bg-blue-700">
              <Download className="mr-2 h-4 w-4" />
              Download QR Code
            </Button>
            <Button variant="outline" onClick={printQRCode}>
              <QrCode className="mr-2 h-4 w-4" />
              Print QR Code
            </Button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <h4 className="font-medium text-blue-900 mb-2">Printing Tips:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Print at least 3x3 inches for easy scanning</li>
              <li>• Use high-quality paper or laminate for durability</li>
              <li>• Place at eye level on tables</li>
              <li>• Test scanning before placing on tables</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
