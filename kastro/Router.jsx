import dom from "../util/dom";

/**
 * @param {{
 *   routeHandler: (string) => void
 * }} props
 */
const Router = ({ routeHandler }) => {
  const onHashChange = () => routeHandler(window.location.hash.slice(1));
  window.onhashchange = onHashChange;
  dom.schedule(onHashChange, 0);
}

/**
 * @param {string} route 
 */
Router.navigate = (route) => window.location.hash = route;

export default Router;
