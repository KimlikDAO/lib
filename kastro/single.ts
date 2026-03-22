type KastroSingle<
  Render extends (...args: any[]) => KastroComponentResult,
  Members extends object
> = ((...args: Parameters<Render>) => ReturnType<Render>)
  & Members
  & { render: Render };

/**
 * Identity helper for singleton components.
 *
 * The type models singleton objects as callable JSX components, while the
 * runtime value remains the authored object. Kastro's transforms can then
 * erase or rewrite `single(...)` as needed.
 */
const single = <
  Render extends (...args: any[]) => KastroComponentResult,
  Members extends object
>(
  component: Members
    & { render: Render }
    & ThisType<KastroSingle<Render, Members>>
): KastroSingle<Render, Members> =>
  component as KastroSingle<Render, Members>;

export { single };
export type { KastroSingle };
