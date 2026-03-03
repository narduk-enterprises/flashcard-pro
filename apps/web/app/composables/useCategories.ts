export function useCategories() {
    const { data: categories, pending, error, refresh } = useFetch('/api/categories', {
        default: () => [],
    })
    return { categories, pending, error, refresh }
}
