'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, Trash2, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const challenges = [
  "Photo with the best man",
  "Photo with the cake",
  "Photo of the first dance",
  "Photo of the bride's bouquet",
  "Photo of the groom's boutonniere",
  "Photo of the wedding rings",
  "Photo of the wedding venue",
  "Photo of the bridesmaids",
  "Photo of the groomsmen",
  "Photo of the newlyweds"
]

interface Photo {
  id: string
  url: string
}

export default function Challenges() {
  const searchParams = useSearchParams()
  const username = searchParams.get('username')
  const [photos, setPhotos] = useState<Record<string, Photo>>({})
  const [currentChallenge, setCurrentChallenge] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (username) {
      const storedPhotos = localStorage.getItem(`photos_${username}`)
      if (storedPhotos) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        setPhotos(JSON.parse(storedPhotos))
      }
    }
  }, [username])

  const savePhotos = (newPhotos: Record<string, Photo>) => {
    setPhotos(newPhotos)
    localStorage.setItem(`photos_${username}`, JSON.stringify(newPhotos))
  }

  const startCamera = async (challenge: string) => {
    stopCamera()
    setCurrentChallenge(challenge)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          aspectRatio: 16/9,
          width: { ideal: 960 },
          height: { ideal: 1280 }
        } 
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      console.error("Error accessing the camera", err)
      toast({
        title: "Error accessing the camera",
        description: "Unable to access camera. Please check your permissions.",
        variant: "destructive",
      })
      setCurrentChallenge(null)
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && currentChallenge) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const context = canvas.getContext('2d')
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        const imageDataUrl = canvas.toDataURL('image/jpeg')
        const newPhotos = { ...photos, [currentChallenge]: { id: Date.now().toString(), url: imageDataUrl } }
        savePhotos(newPhotos)
        stopCamera()
        toast({
          title: "Photo captured",
          description: "Your photo has been captured."
        })
      }
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach(track => track.stop())
    }
    setCurrentChallenge(null)
  }

  const handlePhotoDelete = (challenge: string) => {
    const newPhotos = { ...photos }
    delete newPhotos[challenge]
    savePhotos(newPhotos)
    toast({
      title: "Photo deleted",
      description: "Your photo has been deleted."
    })
  }


  if (!username) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400 p-4">
      <h1 className="text-2xl font-bold mb-6 text-center text-white">Wedding Photo Challenge for {username}</h1>
      {currentChallenge && (
        <div className="fixed inset-0 bg-black bg-opacity-100 flex items-center justify-center z-50 p-1">
          <div className="bg-black  rounded-lg w-[100vw] h-[100vh]">
            <div className="flex justify-between items-center p-2">
              <h2 className="text-xl font-semibold text-white">{currentChallenge}</h2>
              <Button variant="ghost" size="icon" onClick={stopCamera}>
                <X className="h-6 w-6 text-white" />
              </Button>
            </div>
            <div className="relative w-full" style={{ paddingBottom: '90vh' }}>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="absolute inset-0 w-full h-full object-cover rounded-xl"
              />
              <div className="absolute bottom-10 right-1/2 translate-x-1/2 p-2">
              <Button
                onClick={capturePhoto}
                size="lg"
                className="rounded-full bg-white text-black hover:bg-gray-200 w-16 h-16 p-0 flex items-center justify-center"
              >
                <div className="w-14 h-14 rounded-full border-2 border-black" />
              </Button>
              </div>
            </div>

          </div>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {challenges.map((challenge) => (
          <Card key={challenge} className="bg-white">
            <CardHeader>
              <CardTitle className="text-sm">{challenge}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative w-full" style={{ paddingBottom: '100%' }}>
                {photos[challenge] ? (
                  <Image 
                    src={photos[challenge].url} 
                    alt={challenge} 
                    fill
                    style={{ objectFit: 'cover' }}
                    className="rounded"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gray-200 flex items-center justify-center rounded">
                    No photo yet
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-wrap justify-between gap-2">
              <div className="flex gap-2">
                <Button size="sm" onClick={() => startCamera(challenge)}>
                  <Camera className="mr-2 h-4 w-4" /> Take
                </Button>
                </div>
              {photos[challenge] && (
                <Button size="sm" variant="destructive" onClick={() => handlePhotoDelete(challenge)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}