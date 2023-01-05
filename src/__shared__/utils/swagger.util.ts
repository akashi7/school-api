import { getSchemaPath } from "@nestjs/swagger";

export const getPaginatedSchema = (model: string | any): any => {
  return {
    schema: {
      allOf: [
        {
          properties: {
            message: { type: "string" },
            payload: {
              properties: {
                items: {
                  type: "array",
                  items: model
                    ? { $ref: getSchemaPath(model) }
                    : { type: "object" },
                },
                totalItems: { type: "number" },
                itemCount: { type: "number" },
                itemsPerPage: { type: "number" },
                totalPages: { type: "number" },
                currentPage: { type: "number" },
              },
            },
          },
        },
      ],
    },
  };
};

export const getArraySchema = (model: string | any): any => {
  return {
    schema: {
      allOf: [
        {
          properties: {
            message: { type: "string" },
            payload: {
              properties: {
                data: {
                  type: "array",
                  items: model
                    ? { $ref: getSchemaPath(model) }
                    : { type: "object" },
                },
              },
            },
          },
        },
      ],
    },
  };
};

export const getGenericResponseSchema = (model?: string | any): any => {
  return {
    schema: {
      allOf: [
        {
          properties: {
            message: { type: "string" },
            payload: model
              ? { $ref: getSchemaPath(model) }
              : { type: "object" },
          },
        },
      ],
    },
  };
};

export const getGenericErrorResponseSchema = (): any => {
  return {
    schema: {
      allOf: [
        {
          properties: {
            statusCode: { type: "number" },
            message: {
              type: "array",
              items: { type: "string" },
            },
            error: { type: "string" },
            timestamp: { type: "string" },
          },
        },
      ],
    },
  };
};
