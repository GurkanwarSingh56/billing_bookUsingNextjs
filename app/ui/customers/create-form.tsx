// app/ui/customers/create-form.tsx
'use client'; // This component needs interactivity for form state

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useFormState } from 'react-dom';
import { Button } from '@/app/ui/button'; // Assuming you have a Button component
import { createCustomer } from '@/app/lib/actions'; // Adjust path if needed
import { CustomerFormState } from '@/app/lib/definitions'; // Adjust path if needed
import { convertLocalImageToOnlineJpg } from '@/app/lib/image-utils';

export default function CreateCustomerForm() {
    const initialState: CustomerFormState = { message: null, errors: {} };
    const [state, dispatch] = useFormState(createCustomer, initialState);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
    const [localError, setLocalError] = useState<string | null>(null);

    // Add effect to automatically upload image when selected
    useEffect(() => {
        if (imageFile && !uploadedImageUrl && !isUploading) {
            handleImageUpload();
        }
    }, [imageFile, uploadedImageUrl, isUploading]);

    // Handle image file selection from file input
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const file = files[0];
            processImageFile(file);
        }
    };
    
    // Process image file (used by both file input and drag-drop)
    const processImageFile = (file: File) => {
        if (!file) return;
        
        setImageFile(file);
        setLocalError(null);
        
        // Create a preview URL
        const reader = new FileReader();
        reader.onloadend = () => {
            if (reader.result) {
                setImagePreview(reader.result as string);
            }
        };
        reader.readAsDataURL(file);
    };
    
    // Handle drag events
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };
    
    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };
    
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };
    
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (isUploading) {
            return;
        }

        try {
            const files = e.dataTransfer?.files;
            if (!files || files.length === 0) return;

            const file = files[0];
            if (file.type.startsWith('image/')) {
                processImageFile(file);
            }
        } catch (error) {
            console.error('Error handling dropped file:', error);
            setLocalError('Error handling dropped file');
        }
    };
    
    // Handle image upload to external service
    const handleImageUpload = async () => {
        if (!imageFile) {
            console.warn('No image file to upload');
            setLocalError('No image file selected');
            return;
        }
        
        setIsUploading(true);
        setLocalError(null);
        
        try {
            const imageUrl = await convertLocalImageToOnlineJpg(imageFile);
            if (imageUrl) {
                setUploadedImageUrl(imageUrl);
            } else {
                console.warn('Image URL was empty after upload');
                // Set a placeholder if upload failed
                setUploadedImageUrl('https://placehold.co/400x400?text=Customer');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            setLocalError('Failed to upload image. Please try again.');
            // Set a placeholder if upload failed
            setUploadedImageUrl('https://placehold.co/400x400?text=Customer');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        // Use native form action for server dispatch
        <form action={dispatch} className="rounded-md bg-gray-50 p-4 md:p-6">
            {/* Customer Name */}
            <div className="mb-4">
                <label htmlFor="name" className="mb-2 block text-sm font-medium">
                    Customer Name
                </label>
                <div className="relative">
                    <input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="Enter customer name"
                        className="peer block w-full rounded-md border border-gray-200 py-2 text-sm outline-2 placeholder:text-gray-500"
                        aria-describedby="name-error"
                        required // Basic HTML validation
                    />
                </div>
                {/* Display validation errors for name */}
                <div id="name-error" aria-live="polite" aria-atomic="true">
                    {state.errors?.name &&
                        state.errors.name.map((error: string) => (
                            <p className="mt-2 text-sm text-red-500" key={error}>
                                {error}
                            </p>
                        ))}
                </div>
            </div>

            {/* Customer Email */}
            <div className="mb-4">
                <label htmlFor="email" className="mb-2 block text-sm font-medium">
                    Email Address
                </label>
                <div className="relative">
                    <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Enter email address"
                        className="peer block w-full rounded-md border border-gray-200 py-2 text-sm outline-2 placeholder:text-gray-500"
                        aria-describedby="email-error"
                        // required
                    />
                </div>
                <div id="email-error" aria-live="polite" aria-atomic="true">
                    {state.errors?.email &&
                        state.errors.email.map((error: string) => (
                            <p className="mt-2 text-sm text-red-500" key={error}>
                                {error}
                            </p>
                        ))}
                </div>
            </div>

            {/* Customer Image */}
            <div className="mb-4">
                <label htmlFor="customer_image" className="mb-2 block text-sm font-medium">
                    Customer Image
                </label>
                <div className="flex flex-col space-y-2">
                    {/* Drag & Drop Zone & Preview */}
                    <div 
                        className={`border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center cursor-pointer ${isUploading ? 'bg-gray-100' : 'bg-gray-50 hover:bg-gray-100'} transition duration-300`}
                        onDragOver={handleDragOver}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('customer_image')?.click()}
                    >
                        {/* Hidden file input */}
                        <input
                            id="customer_image"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                        />
                        
                        {/* Show loading indicator during upload */}
                        {isUploading && (
                            <div className="flex flex-col items-center">
                                <svg className="animate-spin w-8 h-8 text-blue-500 mb-2" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <p className="text-sm text-blue-500">Uploading image...</p>
                            </div>
                        )}
                        
                        {/* Show instructions when no image selected */}
                        {!isUploading && !imagePreview && !uploadedImageUrl && (
                            <>
                                <svg className="w-10 h-10 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                                <p className="text-sm text-gray-500 mb-1">
                                    Drag & drop an image here, or click to select
                                </p>
                                <p className="text-xs text-gray-400">
                                    Supported formats: JPG, PNG, GIF (max 5MB)
                                </p>
                            </>
                        )}
                        
                        {/* Show preview image when available and not uploading */}
                        {!isUploading && (uploadedImageUrl || imagePreview) && (
                            <div className="text-center">
                                <img
                                    src={uploadedImageUrl || imagePreview!}
                                    alt="Customer Preview"
                                    className="h-24 w-24 object-cover rounded-md border border-gray-200 mx-auto"
                                />
                                {uploadedImageUrl && (
                                    <p className="text-xs text-green-600 mt-2">✓ Image uploaded successfully</p>
                                )}
                                {!uploadedImageUrl && imagePreview && (
                                    <p className="text-xs text-orange-500 mt-2">Image not yet uploaded</p>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {/* Preview Controls and URL */}
                    {(imagePreview || uploadedImageUrl) && !isUploading && (
                        <div className="mt-2 flex items-center space-x-2 flex-wrap">
                            {!uploadedImageUrl && (
                                <button
                                    type="button"
                                    onClick={handleImageUpload}
                                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-xs"
                                >
                                    Upload Now
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => {
                                    setImageFile(null);
                                    setImagePreview(null);
                                    setUploadedImageUrl('');
                                }}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-1 px-3 rounded text-xs"
                            >
                                Remove
                            </button>
                        </div>
                    )}
                    
                    {/* Alternative URL input if user wants to paste a URL directly */}
                    <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">Or enter an image URL directly:</p>
                        <input
                            id="image_url_direct"
                            type="url"
                            placeholder="Enter image URL (e.g., https://...)"
                            className="peer block w-full rounded-md border border-gray-200 py-2 text-sm outline-2 placeholder:text-gray-500"
                            value={uploadedImageUrl}
                            onChange={(e) => {
                                try {
                                    setUploadedImageUrl(e.target.value);
                                } catch (error) {
                                    console.error('Error updating image URL:', error);
                                }
                            }}
                            disabled={isUploading}
                        />
                        <p className="text-xs text-gray-400 mt-1">
                            If no image is provided, a placeholder will be used
                        </p>
                    </div>
                    
                    {/* Hidden input to provide image_url to server */}
                    <input
                        type="hidden"
                        name="image_url"
                        value={uploadedImageUrl || 'https://placehold.co/400x400?text=Customer'}
                    />
                </div>
                
                <div id="image_url-error" aria-live="polite" aria-atomic="true">
                    {state.errors?.image_url &&
                        state.errors.image_url.map((error: string) => (
                            <p className="mt-2 text-sm text-red-500" key={error}>
                                {error}
                            </p>
                        ))}
                </div>
            </div>

            {/* Show local error if present */}
            {localError && (
                <div className="my-2 text-sm text-red-500" aria-live="polite">
                    <p>{localError}</p>
                </div>
            )}

            {/* Display generic form message */}
            {state.message && (
                <div className="my-2 text-sm text-red-500" aria-live="polite">
                    <p>{state.message}</p>
                </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex justify-end gap-4">
                <Link
                    href="/dashboard/customers" // Link back to the customers list
                    className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
                >
                    Cancel
                </Link>
                {/* Disable submit until image conversion done */}
                <Button type="submit" disabled={isUploading}>
                    {isUploading ? 'Converting Image...' : 'Create Customer'}
                </Button>
            </div>
        </form>
    );
}
