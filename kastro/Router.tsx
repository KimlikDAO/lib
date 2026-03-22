import dom from "./dom";

type RouterProps = {
  routeHandler: (route: string) => void;
};

const Router = ({ routeHandler }: RouterProps) => {
  const onHashChange = () => routeHandler(window.location.hash.slice(1));
  window.onhashchange = onHashChange;
  dom.schedule(onHashChange, 0);
}

Router.navigate = (route: string) => window.location.hash = route;

export default Router;
