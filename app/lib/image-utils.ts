// Image Utilities

/**
 * Generate a simple unique ID without external dependencies
 * @returns A unique string ID
 */
function generateUniqueId(length = 8): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 2 + length);
  return timestamp.substring(timestamp.length - 3) + randomStr;
}

/**
 * Uploads an image to ImgBB and returns the URL
 * @param base64Image - Base64 data URL of the image to upload
 * @returns Promise with the uploaded image URL
 */
export async function uploadImageToImgBB(base64Image: string): Promise<string> {
  try {
    // Remove the data:image/jpeg;base64, part if present
    const base64Data = base64Image.includes('base64,') 
      ? base64Image.split('base64,')[1] 
      : base64Image;
    
    // Create a unique name for the image using our custom function
    const uniqueName = `customer_${generateUniqueId(8)}`;
    
    // Free ImgBB API key - for production use, store in environment variables
    const apiKey = '5f40ab2dc4aedf6df2f2698e3cac302d';
    
    // Prepare form data
    const formData = new FormData();
    formData.append('key', apiKey);
    formData.append('image', base64Data);
    formData.append('name', uniqueName);
    
    // Upload to ImgBB
    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    // Check if upload was successful
    if (data.success) {
      return data.data.url;
    } else {
      console.error('Error uploading image:', data.error);
      // Return a fallback image URL instead of throwing an error
      return 'https://placehold.co/400x400?text=Customer';
    }
  } catch (error) {
    console.error('Error in uploadImageToImgBB:', error);
    // Return a fallback image URL instead of throwing an error
    return 'https://placehold.co/400x400?text=Customer';
  }
}

/**
 * Compresses and resizes an image on the client side before upload
 * @param base64Image - Base64 data URL of the image
 * @param quality - Image quality (0-1)
 * @param maxWidth - Maximum width in pixels
 * @returns Promise with compressed image as base64 data URL
 */
export function compressImage(
  base64Image: string, 
  quality = 0.7, 
  maxWidth = 800
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      // Create canvas
      const canvas = document.createElement('canvas');
      
      // Calculate dimensions maintaining aspect ratio
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress image
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to JPEG with specified quality
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedBase64);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = base64Image;
  });
}

/**
 * Converts a local image to an online JPG link
 * @param localImage - Local image as File or base64 data URL
 * @returns Promise with online image URL or fallback URL if conversion fails
 */
export async function convertLocalImageToOnlineJpg(localImage: File | string): Promise<string> {
  // Default placeholder in case upload fails
  const placeholderUrl = 'https://placehold.co/400x400?text=Customer';
  
  // If no image provided, return placeholder
  if (!localImage) {
    return placeholderUrl;
  }
  
  try {
    // Convert File to base64 if needed
    let base64Image: string;
    
    if (typeof localImage !== 'string') {
      base64Image = await fileToBase64(localImage);
    } else {
      base64Image = localImage;
    }
    
    // Compress the image
    const compressedImage = await compressImage(base64Image, 0.7, 800);
    
    // Upload to image hosting service
    const onlineUrl = await uploadImageToImgBB(compressedImage);
    
    return onlineUrl;
  } catch (error) {
    console.error('Error converting local image to online JPG:', error);
    return placeholderUrl; // Return placeholder instead of throwing error
  }
}

/**
 * Converts a File to base64 data URL
 * @param file - The file to convert
 * @returns Promise with base64 data URL
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}
