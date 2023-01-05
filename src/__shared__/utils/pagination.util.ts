import { IPage } from "../interfaces/pagination.interface";

export async function paginate<TModel, TFindManyArgs>(
  model: any,
  args: Omit<TFindManyArgs, "take" | "skip">,
  { page = 0, size = 10 }: { page: number; size: number },
): Promise<IPage<TModel>> {
  const items = (await model.findMany({
    ...args,
    take: size,
    skip: size * page,
  })) as TModel[];
  const totalItems = await model.count({
    ...args,
  });
  return {
    items,
    totalItems,
    itemCount: items.length,
    itemsPerPage: size,
    totalPages: totalItems / size,
    currentPage: page,
  };
}
