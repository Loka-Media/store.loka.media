// Printful thread colors for embroidery products
export const THREAD_COLORS = [
  { value: '#FFFFFF', name: 'White' },
  { value: '#000000', name: 'Black' },
  { value: '#96A1A8', name: 'Gray' },
  { value: '#A67843', name: 'Brown' },
  { value: '#FFCC00', name: 'Yellow' },
  { value: '#E25C27', name: 'Orange' },
  { value: '#CC3366', name: 'Pink' },
  { value: '#CC3333', name: 'Red' },
  { value: '#660000', name: 'Dark Red' },
  { value: '#333366', name: 'Navy' },
  { value: '#005397', name: 'Blue' },
  { value: '#3399FF', name: 'Light Blue' },
  { value: '#6B5294', name: 'Purple' },
  { value: '#01784E', name: 'Green' },
  { value: '#7BA35A', name: 'Light Green' }
];

// File types that support embroidery
export const EMBROIDERY_FILE_TYPES = [
  'embroidery_chest_left',
  'embroidery_chest_center', 
  'embroidery_chest_right',
  'embroidery_back_center',
  'embroidery_back_left',
  'embroidery_back_right',
  'embroidery_sleeve_left',
  'embroidery_sleeve_right',
  'embroidery_front',
  'embroidery_back'
];

// Check if a product supports embroidery
export const isEmbroideryProduct = (product: any): boolean => {
  if (!product) return false;
  
  // Check if product has embroidery technique
  const hasEmbroideryTechnique = product.techniques?.some((technique: any) => 
    technique.key === 'EMBROIDERY' || 
    technique.key === 'embroidery' ||
    technique.display_name?.toLowerCase().includes('embroidery')
  );
  
  // Check if product has embroidery file types
  const hasEmbroideryFiles = product.files?.some((file: any) =>
    EMBROIDERY_FILE_TYPES.includes(file.type)
  );
  
  return hasEmbroideryTechnique || hasEmbroideryFiles;
};

// Get the default embroidery file type for a product
export const getDefaultEmbroideryType = (product: any): string => {
  if (!product?.files) return 'embroidery_chest_center';
  
  // Find the first embroidery file type available
  const embroideryFile = product.files.find((file: any) =>
    EMBROIDERY_FILE_TYPES.includes(file.type)
  );
  
  return embroideryFile?.type || 'embroidery_chest_center';
};

// Check if a file type requires thread colors
export const requiresThreadColors = (fileType: string): boolean => {
  return EMBROIDERY_FILE_TYPES.includes(fileType);
};