

// tslint:disable-next-line:typedef
export function convertSnaps<T>(results: { docs: any[]; }) {
  return results.docs.map((snap) => {
    return {
      id: snap.id,
      ...(snap.data() as any),
    };
  }) as T[];
}
