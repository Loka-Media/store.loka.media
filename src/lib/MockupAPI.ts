/* eslint-disable @typescript-eslint/no-explicit-any */
import { printfulAPI } from "./api";
import { DesignFile } from "./types";
import { createCompositeImagesForPlacements } from "../utils/imageComposer";

type Placement = string;

interface MockupData {
  variant_ids: number[];
  format: "jpg" | "png";
  width?: number;
  product_options?: {
    lifelike?: boolean;
    [key: string]: unknown;
  };
  option_groups?: string[];
  options?: string[];
  files?: {
    placement: Placement;
    image_url: string;
    position?: {
      area_width: number;
      area_height: number;
      width: number;
      height: number;
      top: number;
      left: number;
    };
  }[];
  product_template_id?: number;
}

interface TaskResponse {
  result: {
    task_key: string;
  };
  code: number;
}

interface TaskStatusResponse {
  result?: {
    mockups?: Array<{
      variant_ids: number[];
      placement: string;
      mockup_url: string;
      extra?: { title?: string; option?: string; option_group?: string };
    }>;
    status: string;
  };
  status: "pending" | "completed" | "failed";
  error?: string;
}

class MockupAPI {
  async createMockupTask(
    productId: number,
    mockupData: MockupData
  ): Promise<TaskResponse> {
    try {
      return await printfulAPI.createMockupTask(
        productId,
        mockupData as Parameters<typeof printfulAPI.createMockupTask>[1]
      );
    } catch (error) {
      console.error("Error creating mockup task:", error);
      throw error;
    }
  }

  async getMockupTaskStatus(taskKey: string): Promise<TaskStatusResponse> {
    try {
      return await printfulAPI.getMockupTaskStatus(taskKey);
    } catch (error) {
      console.error("Error getting mockup task status:", error);
      throw error;
    }
  }

  async pollMockupStatus(
    taskKey: string,
    maxAttempts = 24, // 5 sec + (23 * 5 sec) = ~2 minutes total
    onStatusUpdate?: (status: string, attempts: number) => void
  ): Promise<TaskStatusResponse> {
    let attempts = 0;

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          attempts++;
          onStatusUpdate?.(
            `Checking mockup status (attempt ${attempts})...`,
            attempts
          );

          const result = await this.getMockupTaskStatus(taskKey);

          // Check for completion with multiple possible status formats
          const status = result.status || result.result?.status;

          if (status === "completed") {
            onStatusUpdate?.("Mockup completed successfully!", attempts);
            resolve(result);
          } else if (status === "failed") {
            reject(new Error(result.error || "Mockup generation failed"));
          } else if (attempts >= maxAttempts) {
            reject(new Error("Mockup generation timed out after 2 minutes"));
          } else {
            // Use 5-second intervals for polling
            const nextInterval = 5000;
            onStatusUpdate?.("Mockup still processing...", attempts);
            setTimeout(poll, nextInterval);
          }
        } catch (error) {
          console.error(`Polling attempt ${attempts} failed:`, error);
          if (attempts >= maxAttempts) {
            reject(error);
          } else {
            // Continue polling even if individual requests fail
            setTimeout(poll, 5000);
          }
        }
      };

      // Initial delay of 5 seconds before first poll
      onStatusUpdate?.(
        "Mockup generation started. Waiting 5 seconds before checking status...",
        0
      );
      setTimeout(poll, 5000);
    });
  }

  async generateProductMockup({
    productId,
    variantIds,
    designFiles,
    format = "jpg",
    width,
    productOptions,
    optionGroups,
    options,
    productTemplateId,
    onStatusUpdate,
    printFiles,
  }: {
    productId: number;
    variantIds: number[];
    designFiles?: DesignFile[];
    format?: "jpg" | "png";
    width?: number;
    productOptions?: { lifelike?: boolean; [key: string]: unknown };
    optionGroups?: string[];
    options?: string[];
    productTemplateId?: number;
    onStatusUpdate?: (status: string, attempts: number) => void;
    printFiles?: any;
  }): Promise<
    Array<{
      url: string;
      placement: string;
      variant_ids: number[];
      title?: string;
      option?: string;
      option_group?: string;
    }>
  > {
    try {
      const mockupData: MockupData = {
        variant_ids: variantIds,
        format,
      };

      // Add optional parameters
      if (width) mockupData.width = width;
      if (productOptions) mockupData.product_options = productOptions;
      if (optionGroups && optionGroups.length > 0)
        mockupData.option_groups = optionGroups;
      if (options && options.length > 0) mockupData.options = options;
      if (productTemplateId) mockupData.product_template_id = productTemplateId;

      // Add files if provided - Create composite images for multiple designs per placement
      if (designFiles && designFiles.length > 0) {
        onStatusUpdate?.("Processing design files for mockup generation...", 0);
        
        try {
          // Check if we have multiple designs per placement
          const designsByPlacement = designFiles.reduce<Record<string, DesignFile[]>>((acc, design) => {
            if (!acc[design.placement]) acc[design.placement] = [];
            acc[design.placement].push(design);
            return acc;
          }, {});
          
          const needsCompositing = Object.values(designsByPlacement).some(designs => designs.length > 1);
          
          let finalDesigns: DesignFile[];
          
          if (needsCompositing && printFiles) {
            onStatusUpdate?.("Creating composite images for multiple designs per placement...", 0);
            finalDesigns = await createCompositeImagesForPlacements(
              designFiles.filter(file => file.placement && file.url),
              printFiles
            );
          } else {
            // No compositing needed or no print files available - use most recent per placement
            const uniqueDesignsByPlacement = designFiles
              .filter(file => file.placement && file.url)
              .reduce<Record<string, DesignFile>>((acc, file) => {
                if (!acc[file.placement] || file.id > acc[file.placement].id) {
                  acc[file.placement] = file;
                }
                return acc;
              }, {});
            finalDesigns = Object.values(uniqueDesignsByPlacement);
          }
          
          mockupData.files = finalDesigns.map((file) => ({
          placement: file.placement,
          image_url: file.url, // This should be the full URL to the uploaded file
          position: file.position
            ? {
                area_width: file.position.area_width,
                area_height: file.position.area_height,
                width: file.position.width,
                height: file.position.height,
                top: file.position.top,
                left: file.position.left,
              }
            : undefined,
        }));
        
        // Debug: Log file URLs to check they are valid
        console.log('Design file URLs being sent to API:', 
          mockupData.files.map(f => ({ placement: f.placement, url: f.image_url })));
        
        // Validate that all files have valid URLs
        const invalidFiles = mockupData.files.filter(f => 
          !f.image_url || 
          (!f.image_url.startsWith('http') && !f.image_url.startsWith('data:'))
        );
        
        if (invalidFiles.length > 0) {
          console.error('Invalid file URLs found:', invalidFiles);
          throw new Error(`Invalid file URLs: ${invalidFiles.map(f => f.placement).join(', ')}`);
        }
        
        console.log(`Processed designs for mockup: ${designFiles.length} total designs -> ${mockupData.files.length} final images sent to Printful API`);
        
        } catch (error) {
          console.error('Error processing design files:', error);
          onStatusUpdate?.("Error processing designs, using fallback approach...", 0);
          
          // Fallback: use most recent design per placement
          const uniqueDesignsByPlacement = designFiles
            .filter(file => file.placement && file.url)
            .reduce<Record<string, DesignFile>>((acc, file) => {
              if (!acc[file.placement] || file.id > acc[file.placement].id) {
                acc[file.placement] = file;
              }
              return acc;
            }, {});
            
          mockupData.files = Object.values(uniqueDesignsByPlacement).map((file) => ({
            placement: file.placement,
            image_url: file.url,
            position: file.position ? {
              area_width: file.position.area_width,
              area_height: file.position.area_height,
              width: file.position.width,
              height: file.position.height,
              top: file.position.top,
              left: file.position.left,
            } : undefined,
          }));
        }
      }

      console.log("Creating mockup task with data:", mockupData);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(
            `mockup_request_${productId}`,
            JSON.stringify(mockupData)
          );
          console.log(
            `Mockup request for product ${productId} stored in local storage.`
          );
        } catch (e) {
          console.error("Error storing mockup request in local storage:", e);
        }
      }
      onStatusUpdate?.("Creating mockup generation task...", 0);

      const taskResponse = await this.createMockupTask(productId, mockupData);

      if (!taskResponse.result?.task_key) {
        throw new Error("No task key returned from mockup creation");
      }

      const taskKey = taskResponse.result.task_key;
      console.log("Mockup task created with key:", taskKey);
      onStatusUpdate?.("Task created successfully. Starting polling...", 0);

      const result = await this.pollMockupStatus(taskKey, 24, onStatusUpdate);

      if (result.result?.mockups && result.result.mockups.length > 0) {
        // Extract all mockup URLs including main and extra variations
        const allMockups: Array<{
          url: string;
          placement: string;
          variant_ids: number[];
          title?: string;
          option?: string;
          option_group?: string;
        }> = [];

        result.result.mockups.forEach((mockup) => {
          // Add the main mockup URL
          if (mockup.mockup_url) {
            allMockups.push({
              url: mockup.mockup_url,
              placement: mockup.placement,
              variant_ids: mockup.variant_ids,
              title: `${mockup.placement} (Main)`,
              option: "Main",
              option_group: "Default",
            });
          }

          // Add all extra mockup variations
          if (mockup.extra && Array.isArray(mockup.extra)) {
            mockup.extra.forEach((extraMockup: any) => {
              if (extraMockup.url) {
                allMockups.push({
                  url: extraMockup.url,
                  placement: mockup.placement,
                  variant_ids: mockup.variant_ids,
                  title:
                    extraMockup.title ||
                    `${mockup.placement} (${
                      extraMockup.option || "Variation"
                    })`,
                  option: extraMockup.option || "Variation",
                  option_group: extraMockup.option_group || "Extra",
                });
              }
            });
          }
        });

        console.log(
          `Mockups generated successfully: ${allMockups.length} total variations`,
          allMockups
        );
        return allMockups;
      } else {
        throw new Error("No mockup URLs in completed task result");
      }
    } catch (error) {
      console.error("Error generating product mockup:", error);
      throw error;
    }
  }
}

export const mockupAPI = new MockupAPI();
