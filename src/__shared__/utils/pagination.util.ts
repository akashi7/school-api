import { IPage } from "../interfaces/pagination.interface";

/**
 * Paginate results from prisma query
 * @param model Prisma model
 * @param args Find args
 * @param page page number
 * @param size number of items per page
 * @returns Promise<IPage<TModel>>
 * @author [Brian Gitego](https://github.com/gitegob)
 */
export async function paginate<TModel, TFindManyArgs>(
  model: any,
  args: Omit<TFindManyArgs, "take" | "skip">,
  page = 0,
  size = 10,
): Promise<IPage<TModel>> {
  const items = (await model.findMany({
    ...args,
    take: size,
    skip: size * page,
  })) as TModel[];
  args["include"] = null;
  const totalItems = await model.count({
    ...args,
  });
  return {
    items,
    totalItems,
    itemCount: items.length,
    itemsPerPage: size,
    totalPages: Math.ceil(totalItems / size),
    currentPage: page,
  };
}
