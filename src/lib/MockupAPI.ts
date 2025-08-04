import { DesignFile } from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

type Placement = string;


interface MockupData {
  variant_ids: number[]; // Printful expects variant IDs as numbers
  format: "jpg" | "png";
  files: {
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
}

interface TaskResponse {
  result: {
    task_key: string;
  };
  code: number;
}

interface TaskStatusResponse {
  result?: {
    mockup_url?: string;
  };
  status: "pending" | "completed" | "failed";
  error?: string;
}

class MockupAPI {
  async createMockupTask(mockupData: MockupData): Promise<TaskResponse> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/printful/mockup-generator/create-task`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(mockupData),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating mockup task:", error);
      throw error;
    }
  }

  async getMockupTaskStatus(taskKey: string): Promise<TaskStatusResponse> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/printful/mockup-tasks/${taskKey}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting mockup task status:", error);
      throw error;
    }
  }

  async pollMockupStatus(
    taskKey: string,
    maxAttempts = 30,
    intervalMs = 2000
  ): Promise<TaskStatusResponse> {
    let attempts = 0;

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          attempts++;
          const result = await this.getMockupTaskStatus(taskKey);

          if (result.status === "completed") {
            resolve(result);
          } else if (result.status === "failed") {
            reject(new Error(result.error || "Mockup generation failed"));
          } else if (attempts >= maxAttempts) {
            reject(new Error("Mockup generation timed out"));
          } else {
            setTimeout(poll, intervalMs);
          }
        } catch (error) {
          if (attempts >= maxAttempts) {
            reject(error);
          } else {
            setTimeout(poll, intervalMs);
          }
        }
      };

      poll();
    });
  }

  async generateProductMockup({
    variantIds,
    designFiles,
    format = "jpg",
  }: {
    variantIds: number[];
    designFiles: DesignFile[];
    format?: "jpg" | "png";
  }): Promise<string> {
    try {
      const files: MockupData["files"] = designFiles.map((file) => ({
        placement: file.placement,
        image_url: file.url,
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

      const mockupData: MockupData = {
        variant_ids: variantIds,
        format,
        files,
      };

      console.log("Creating mockup task with data:", mockupData);

      const taskResponse = await this.createMockupTask(mockupData);

      if (!taskResponse.result?.task_key) {
        throw new Error("No task key returned from mockup creation");
      }

      const taskKey = taskResponse.result.task_key;
      console.log("Mockup task created with key:", taskKey);

      const result = await this.pollMockupStatus(taskKey);

      if (result.result?.mockup_url) {
        console.log("Mockup generated successfully:", result.result.mockup_url);
        return result.result.mockup_url;
      } else {
        throw new Error("No mockup URL in completed task result");
      }
    } catch (error) {
      console.error("Error generating product mockup:", error);
      throw error;
    }
  }
}

export const mockupAPI = new MockupAPI();
