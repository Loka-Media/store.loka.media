// types/canvas.ts

export interface DesignFile {
  id: number;
  filename: string;
  url: string;
  type: "design";
  placement: string;
  position: {
    area_width: number;
    area_height: number;
    width: number;
    height: number;
    top: number;
    left: number;
    limit_to_print_area: boolean;
  };
}

export interface ProductForm {
  name: string;
  description: string;
  markupPercentage: string;
  category: string;
  tags: string[];
}

export interface Product {
  id: number;
  title?: string;
  model?: string;
  description?: string;
  type_name?: string;
  type?: string;
  image: string;
  variants?: Variant[];
}

export interface Variant {
  id: number;
  size: string;
  color: string;
  color_code?: string;
  price: string;
  image: string;
}

export interface UploadedFile {
  id: number;
  filename: string;
  file_url: string;
}

export interface Position {
  area_width: number;
  area_height: number;
  width: number;
  height: number;
  top: number;
  left: number;
  limit_to_print_area: boolean;
}


export interface PlacementPosition {
  area_width: number;
  area_height: number;
  width: number;
  height: number;
  top: number;
  left: number;
  limit_to_print_area: boolean;
}

export interface ProductForm {
  name: string;
  description: string;
  markupPercentage: string;
  category: string;
  tags: string[];
}

export interface PrintfulVariant {
  id: number;
  price: string;
  size: string;
  color: string;
  color_code: string;
  image: string;
}

export interface PrintfulProduct {
  id: number;
  title: string;
  model?: string;
  description: string;
  image: string;
  type?: string;
  type_name?: string;
  variants?: PrintfulVariant[];
}
