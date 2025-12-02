import { v2 as cloudinary } from 'cloudinary'

// Validar que las variables de entorno estén configuradas
const cloudName = process.env.CLOUDINARY_CLOUD_NAME
const apiKey = process.env.CLOUDINARY_API_KEY
const apiSecret = process.env.CLOUDINARY_API_SECRET

const isConfigured = !!(cloudName && apiKey && apiSecret)

if (!isConfigured) {
	const missingVars = []
	if (!cloudName) missingVars.push('CLOUDINARY_CLOUD_NAME')
	if (!apiKey) missingVars.push('CLOUDINARY_API_KEY')
	if (!apiSecret) missingVars.push('CLOUDINARY_API_SECRET')

	console.warn(
		`Cloudinary no está configurado. Variables faltantes: ${missingVars.join(', ')}. ` +
		'La funcionalidad de logos de coaches no estará disponible hasta que se configuren estas variables.'
	)
}

// Configurar Cloudinary solo si las variables están disponibles
if (isConfigured) {
	try {
		cloudinary.config({
			cloud_name: cloudName,
			api_key: apiKey,
			api_secret: apiSecret,
			secure: true,
		})
		console.log('Cloudinary configurado correctamente')
	} catch (error) {
		console.error('Error al configurar Cloudinary:', error)
	}
}

/**
 * Sube una imagen a Cloudinary
 * @param fileBuffer - Buffer del archivo
 * @param folder - Carpeta donde guardar (opcional)
 * @param publicId - ID público personalizado (opcional)
 * @returns URL de la imagen subida
 * @throws Error si Cloudinary no está configurado o si falla la subida
 */
export async function uploadImageToCloudinary(
	fileBuffer: Buffer,
	folder?: string,
	publicId?: string
): Promise<string> {
	// Validar configuración antes de intentar subir
	if (!isConfigured) {
		const errorMessage = 
			'Cloudinary no está configurado'
		console.error(errorMessage)
		throw new Error(errorMessage)
	}

	// Validar que el buffer no esté vacío
	if (!fileBuffer || fileBuffer.length === 0) {
		const errorMessage = 'El archivo está vacío o no es válido'
		console.error('Error al subir imagen:', errorMessage)
		throw new Error(errorMessage)
	}

	try {
		return new Promise((resolve, reject) => {
			const uploadOptions: any = {
				resource_type: 'image' as const,
				folder: folder || 'coach-logos',
			}

			if (publicId) {
				uploadOptions.public_id = publicId
			}

			const uploadStream = cloudinary.uploader.upload_stream(
				uploadOptions,
				(error, result) => {
					if (error) {
						const errorMessage = error.message || 'Error desconocido al subir imagen a Cloudinary'
						console.error('Error de Cloudinary:', {
							message: errorMessage,
							http_code: error.http_code,
							name: error.name,
							folder,
							publicId,
						})
						reject(new Error(`Error al subir imagen: ${errorMessage}`))
						return
					}
					
					if (!result?.secure_url) {
						const errorMessage = 'Cloudinary no devolvió una URL válida para la imagen subida'
						console.error('Error al subir imagen:', errorMessage, { result })
						reject(new Error(errorMessage))
						return
					}

					console.log('Imagen subida exitosamente a Cloudinary:', {
						publicId: result.public_id,
						url: result.secure_url,
						format: result.format,
						bytes: result.bytes,
					})

					resolve(result.secure_url)
				}
			)

			uploadStream.end(fileBuffer)
		})
	} catch (error) {
		const errorMessage = error instanceof Error 
			? error.message 
			: 'Error desconocido al subir imagen a Cloudinary'
		console.error('Error inesperado al subir imagen:', errorMessage, error)
		throw new Error(`Error al subir imagen: ${errorMessage}`)
	}
}

/**
 * Elimina una imagen de Cloudinary
 * @param imageUrl - URL de la imagen a eliminar
 * @throws Error si Cloudinary no está configurado
 */
export async function deleteImageFromCloudinary(imageUrl: string): Promise<void> {
	// Validar configuración
	if (!isConfigured) {
		const errorMessage = 
			'Cloudinary no está configurado. No se puede eliminar la imagen.'
		console.error(errorMessage)
		throw new Error(errorMessage)
	}

	// Validar que la URL sea válida
	if (!imageUrl || typeof imageUrl !== 'string') {
		console.warn('URL de imagen inválida para eliminar:', imageUrl)
		return
	}

	// Verificar que sea una URL de Cloudinary
	if (!isCloudinaryUrl(imageUrl)) {
		console.warn('La URL proporcionada no es de Cloudinary, no se puede eliminar:', imageUrl)
		return
	}

	try {
		// Extraer el public_id de la URL de Cloudinary
		// Formato: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{folder}/{public_id}.{format}
		const urlMatch = imageUrl.match(/\/upload\/(?:v\d+\/)?([^/]+\/[^/]+|\w+)(?:\.\w+)?$/)
		
		if (!urlMatch || !urlMatch[1]) {
			console.warn('No se pudo extraer public_id de la URL de Cloudinary:', imageUrl)
			return
		}

		const publicId = urlMatch[1]

		const result = await cloudinary.uploader.destroy(publicId)

		if (result.result === 'ok') {
			console.log('Imagen eliminada exitosamente de Cloudinary:', { publicId })
		} else if (result.result === 'not found') {
			console.warn('La imagen no existe en Cloudinary (puede que ya haya sido eliminada):', { publicId })
		} else {
			console.warn('Resultado inesperado al eliminar imagen de Cloudinary:', { publicId, result: result.result })
		}
	} catch (error) {
		const errorMessage = error instanceof Error 
			? error.message 
			: 'Error desconocido al eliminar imagen de Cloudinary'
		console.error('Error al eliminar imagen de Cloudinary:', errorMessage, { imageUrl, error })
		// No lanzar error para no interrumpir el flujo si la imagen ya no existe
		// Solo loguear el error
	}
}

/**
 * Verifica si una URL es de Cloudinary
 * @param url - URL a verificar
 * @returns true si la URL es de Cloudinary, false en caso contrario
 */
export function isCloudinaryUrl(url: string): boolean {
	if (!url || typeof url !== 'string') {
		return false
	}
	return url.includes('cloudinary.com') && url.includes('res.cloudinary.com')
}

/**
 * Obtiene el estado de configuración de Cloudinary
 * @returns true si Cloudinary está configurado, false en caso contrario
 */
export function isCloudinaryConfigured(): boolean {
	return isConfigured
}
