"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useToast } from "@/components/ToastProvider";

interface SpeechBubble {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  type: 'speech' | 'thought' | 'caption';
}

export default function ComicImageGenerator() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [bubbles, setBubbles] = useState<SpeechBubble[]>([]);
  const [selectedBubble, setSelectedBubble] = useState<string | null>(null);
  const [isCreatingBubble, setIsCreatingBubble] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [currentText, setCurrentText] = useState("");
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showError, showSuccess } = useToast();

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showError('Please upload a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
      setBubbles([]);
      setSelectedBubble(null);
      showSuccess('Image uploaded successfully');
    };
    reader.readAsDataURL(file);
  }, [showError, showSuccess]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !uploadedImage) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Draw bubbles
      bubbles.forEach(bubble => {
        // Draw bubble background
        ctx.fillStyle = 'white';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        
        if (bubble.type === 'thought') {
          // Draw thought bubble (circular)
          const centerX = bubble.x + bubble.width / 2;
          const centerY = bubble.y + bubble.height / 2;
          const radiusX = bubble.width / 2;
          const radiusY = bubble.height / 2;
          
          ctx.beginPath();
          ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
        } else {
          // Draw speech bubble (rounded rectangle with tail)
          const radius = 10;
          ctx.beginPath();
          ctx.roundRect(bubble.x, bubble.y, bubble.width, bubble.height, radius);
          ctx.fill();
          ctx.stroke();
          
          // Draw tail for speech bubble
          if (bubble.type === 'speech') {
            const tailX = bubble.x + bubble.width * 0.2;
            const tailY = bubble.y + bubble.height;
            ctx.beginPath();
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(tailX - 15, tailY + 20);
            ctx.lineTo(tailX + 15, tailY + 20);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          }
        }
        
        // Draw text
        if (bubble.text) {
          ctx.fillStyle = '#000000';
          ctx.font = '16px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          const centerX = bubble.x + bubble.width / 2;
          const centerY = bubble.y + bubble.height / 2;
          
          // Simple text wrapping
          const words = bubble.text.split(' ');
          const lines = [];
          let currentLine = '';
          
          words.forEach(word => {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const metrics = ctx.measureText(testLine);
            if (metrics.width > bubble.width - 20 && currentLine) {
              lines.push(currentLine);
              currentLine = word;
            } else {
              currentLine = testLine;
            }
          });
          if (currentLine) lines.push(currentLine);
          
          lines.forEach((line, index) => {
            const y = centerY + (index - lines.length / 2 + 0.5) * 20;
            ctx.fillText(line, centerX, y);
          });
        }
        
        // Highlight selected bubble
        if (bubble.id === selectedBubble) {
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 3;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(bubble.x - 2, bubble.y - 2, bubble.width + 4, bubble.height + 4);
        }
      });
    };
    img.src = uploadedImage;
  }, [uploadedImage, bubbles, selectedBubble]);

  const handleCanvasMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!uploadedImage) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check if clicking on existing bubble
    const clickedBubble = bubbles.find(bubble => 
      x >= bubble.x && x <= bubble.x + bubble.width &&
      y >= bubble.y && y <= bubble.y + bubble.height
    );

    if (clickedBubble) {
      setSelectedBubble(clickedBubble.id);
      setCurrentText(clickedBubble.text);
    } else {
      // Start creating new bubble
      setIsCreatingBubble(true);
      setDragStart({ x, y });
      setSelectedBubble(null);
    }
  }, [uploadedImage, bubbles]);

  const handleCanvasMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isCreatingBubble || !dragStart) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Draw preview rectangle
    drawCanvas();
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = '#3b82f6';
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(
        Math.min(dragStart.x, x),
        Math.min(dragStart.y, y),
        Math.abs(x - dragStart.x),
        Math.abs(y - dragStart.y)
      );
    }
  }, [isCreatingBubble, dragStart, drawCanvas]);

  const handleCanvasMouseUp = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isCreatingBubble || !dragStart) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const width = Math.abs(x - dragStart.x);
    const height = Math.abs(y - dragStart.y);

    if (width > 20 && height > 20) {
      const newBubble: SpeechBubble = {
        id: Date.now().toString(),
        x: Math.min(dragStart.x, x),
        y: Math.min(dragStart.y, y),
        width,
        height,
        text: '',
        type: 'speech'
      };

      setBubbles(prev => [...prev, newBubble]);
      setSelectedBubble(newBubble.id);
      setCurrentText('');
    }

    setIsCreatingBubble(false);
    setDragStart(null);
  }, [isCreatingBubble, dragStart]);

  const handleTextChange = useCallback((text: string) => {
    setCurrentText(text);
    if (selectedBubble) {
      setBubbles(prev => prev.map(bubble => 
        bubble.id === selectedBubble 
          ? { ...bubble, text }
          : bubble
      ));
    }
  }, [selectedBubble]);

  const deleteBubble = useCallback((bubbleId: string) => {
    setBubbles(prev => prev.filter(bubble => bubble.id !== bubbleId));
    if (selectedBubble === bubbleId) {
      setSelectedBubble(null);
      setCurrentText('');
    }
  }, [selectedBubble]);

  const exportImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a temporary canvas without selection highlights
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    if (!tempCtx || !uploadedImage) return;

    const img = new Image();
    img.onload = () => {
      // Draw everything except selection highlights
      tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
      tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
      
      // Draw bubbles without selection
      bubbles.forEach(bubble => {
        tempCtx.fillStyle = 'white';
        tempCtx.strokeStyle = '#000000';
        tempCtx.lineWidth = 2;
        tempCtx.setLineDash([]);
        
        if (bubble.type === 'thought') {
          const centerX = bubble.x + bubble.width / 2;
          const centerY = bubble.y + bubble.height / 2;
          const radiusX = bubble.width / 2;
          const radiusY = bubble.height / 2;
          
          tempCtx.beginPath();
          tempCtx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
          tempCtx.fill();
          tempCtx.stroke();
        } else {
          const radius = 10;
          tempCtx.beginPath();
          tempCtx.roundRect(bubble.x, bubble.y, bubble.width, bubble.height, radius);
          tempCtx.fill();
          tempCtx.stroke();
          
          if (bubble.type === 'speech') {
            const tailX = bubble.x + bubble.width * 0.2;
            const tailY = bubble.y + bubble.height;
            tempCtx.beginPath();
            tempCtx.moveTo(tailX, tailY);
            tempCtx.lineTo(tailX - 15, tailY + 20);
            tempCtx.lineTo(tailX + 15, tailY + 20);
            tempCtx.closePath();
            tempCtx.fill();
            tempCtx.stroke();
          }
        }
        
        if (bubble.text) {
          tempCtx.fillStyle = '#000000';
          tempCtx.font = '16px Arial';
          tempCtx.textAlign = 'center';
          tempCtx.textBaseline = 'middle';
          
          const centerX = bubble.x + bubble.width / 2;
          const centerY = bubble.y + bubble.height / 2;
          
          const words = bubble.text.split(' ');
          const lines = [];
          let currentLine = '';
          
          words.forEach(word => {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const metrics = tempCtx.measureText(testLine);
            if (metrics.width > bubble.width - 20 && currentLine) {
              lines.push(currentLine);
              currentLine = word;
            } else {
              currentLine = testLine;
            }
          });
          if (currentLine) lines.push(currentLine);
          
          lines.forEach((line, index) => {
            const y = centerY + (index - lines.length / 2 + 0.5) * 20;
            tempCtx.fillText(line, centerX, y);
          });
        }
      });
      
      // Download the image
      tempCanvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'comic-image.png';
          a.click();
          URL.revokeObjectURL(url);
          showSuccess('Image exported successfully');
        }
      });
    };
    img.src = uploadedImage;
  }, [uploadedImage, bubbles, showSuccess]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Comic Book Speech Bubble Editor</h1>
        
        <div className="flex gap-8">
          {/* Main Canvas Area */}
          <div className="flex-1">
            <div className="bg-gray-800 rounded-lg p-4">
              {!uploadedImage ? (
                <div 
                  className="border-2 border-dashed border-gray-600 rounded-lg p-12 text-center cursor-pointer hover:border-gray-500"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="text-gray-400">
                    <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-xl mb-2">Upload an image to get started</p>
                    <p className="text-sm">Click here or drag and drop an image file</p>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <canvas
                    ref={canvasRef}
                    width={800}
                    height={600}
                    className="max-w-full border border-gray-600 rounded cursor-crosshair"
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                  />
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              
              <div className="flex gap-4 mt-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  Upload New Image
                </button>
                
                {uploadedImage && bubbles.length > 0 && (
                  <button
                    onClick={exportImage}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg"
                  >
                    Export Image
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Side Panel */}
          <div className="w-80 bg-gray-800 rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">Bubble Controls</h2>
            
            {selectedBubble ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Bubble Text</label>
                  <textarea
                    value={currentText}
                    onChange={(e) => handleTextChange(e.target.value)}
                    placeholder="Enter speech bubble text..."
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg resize-none"
                    rows={4}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Bubble Type</label>
                  <select
                    value={bubbles.find(b => b.id === selectedBubble)?.type || 'speech'}
                    onChange={(e) => {
                      setBubbles(prev => prev.map(bubble => 
                        bubble.id === selectedBubble 
                          ? { ...bubble, type: e.target.value as 'speech' | 'thought' | 'caption' }
                          : bubble
                      ));
                    }}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
                  >
                    <option value="speech">Speech Bubble</option>
                    <option value="thought">Thought Bubble</option>
                    <option value="caption">Caption Box</option>
                  </select>
                </div>
                
                <button
                  onClick={() => deleteBubble(selectedBubble)}
                  className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
                >
                  Delete Bubble
                </button>
              </div>
            ) : (
              <div className="text-gray-400">
                <p className="mb-4">Click and drag on the image to create a speech bubble, or click an existing bubble to edit it.</p>
                
                {bubbles.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2">Existing Bubbles:</h3>
                    <div className="space-y-2">
                      {bubbles.map((bubble, index) => (
                        <div 
                          key={bubble.id}
                          className="p-2 bg-gray-700 rounded cursor-pointer hover:bg-gray-600"
                          onClick={() => {
                            setSelectedBubble(bubble.id);
                            setCurrentText(bubble.text);
                          }}
                        >
                          <div className="text-sm">
                            Bubble {index + 1} ({bubble.type})
                          </div>
                          <div className="text-xs text-gray-400 truncate">
                            {bubble.text || 'No text'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-8 text-center text-gray-400">
          <p>Instructions: Upload an image, then click and drag to create speech bubbles. Click on bubbles to edit their text.</p>
        </div>
      </div>
    </div>
  );
}