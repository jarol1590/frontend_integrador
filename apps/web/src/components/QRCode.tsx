'use client'
import { useEffect, useRef } from 'react'
import QRCodeLib from 'qrcode'

interface Props {
  value: string
  size?: number
}

export default function QRCode({ value, size = 96 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    QRCodeLib.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 1,
      color: { dark: '#1a1a1a', light: '#ffffff' },
    })
  }, [value, size])

  return <canvas ref={canvasRef} width={size} height={size} style={{ width: size, height: size }} />
}
