import { v4 as uuidv4 } from 'uuid'
import { supabase } from './supabase'

/**
 * Upload a user avatar to the avatars bucket
 * @param userId User ID
 * @param file File to upload
 * @param isPublic Whether the avatar should be public or private
 * @returns URL of the uploaded avatar
 */
export async function uploadAvatar(
  userId: string,
  file: File,
  isPublic = true,
): Promise<string | null> {
  try {
    // Generate a unique filename to avoid collisions
    const fileExt = file.name.split('.').pop()
    const fileName = `${uuidv4()}.${fileExt}`

    // Set the visibility folder
    const visibility = isPublic ? 'public' : 'private'

    // Create the path for the avatar: userId/visibility/filename
    const filePath = `${userId}/${visibility}/${fileName}`

    // Upload the file
    const { error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (error) {
      console.error('Error uploading avatar:', error)
      return null
    }

    // Get the public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('avatars').getPublicUrl(filePath)

    return publicUrl
  }
  catch (error) {
    console.error('Error in uploadAvatar:', error)
    return null
  }
}

/**
 * Delete a user's avatar
 * @param userId User ID
 * @param fileName Filename of the avatar to delete
 * @param isPublic Whether the avatar is public or private
 * @returns Success status
 */
export async function deleteAvatar(
  userId: string,
  fileName: string,
  isPublic = true,
): Promise<boolean> {
  try {
    const visibility = isPublic ? 'public' : 'private'
    const filePath = `${userId}/${visibility}/${fileName}`

    const { error } = await supabase.storage.from('avatars').remove([filePath])

    return !error
  }
  catch (error) {
    console.error('Error deleting avatar:', error)
    return false
  }
}

/**
 * Get the URL for a user's avatar
 * @param userId User ID
 * @param fileName Filename of the avatar
 * @param isPublic Whether the avatar is public or private
 * @returns URL of the avatar
 */
export function getAvatarUrl(
  userId: string,
  fileName: string,
  isPublic = true,
): string {
  const visibility = isPublic ? 'public' : 'private'
  const filePath = `${userId}/${visibility}/${fileName}`

  const {
    data: { publicUrl },
  } = supabase.storage.from('avatars').getPublicUrl(filePath)

  return publicUrl
}
