import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { createRoot } from "react-dom/client";
import { Directory } from "../src/routes/index";
import "../src/styles.css";
import "./preview.css";

const routeTree = createRootRoute({
  component: () => (
    <>
      <p className="preview-notice" role="status">
        Development preview: sample shops only. Shop detail links are not
        available.
      </p>
      <Directory
        data={{
          ok: true,
          shops: [
            {
              id: "sample-shop-1",
              details: { name: "Example Coffee" },
              locations: [
                {
                  id: "sample-location-1",
                  shopId: "sample-shop-1",
                  details: {
                    type: "cafe",
                    neighborhoodId: "Uptown",
                    address: "123 Main Street",
                    coordinates: { latitude: 35.2271, longitude: -80.8431 },
                  },
                },
              ],
            },
            {
              id: "sample-shop-2",
              details: { name: "Mobile Coffee" },
              locations: [
                {
                  id: "sample-location-2",
                  shopId: "sample-shop-2",
                  details: { type: "mobile coffee" },
                },
              ],
            },
            {
              id: "sample-shop-3",
              details: { name: "Sample Bakery" },
              locations: [
                {
                  id: "sample-location-3",
                  shopId: "sample-shop-3",
                  details: {
                    type: "bakery",
                    neighborhoodId: "South End",
                    address: "456 Example Avenue",
                    coordinates: { latitude: 35.212, longitude: -80.857 },
                  },
                },
              ],
            },
          ],
        }}
      />
    </>
  ),
});
const router = createRouter({
  routeTree,
  history: createMemoryHistory({ initialEntries: ["/"] }),
});
const element = document.getElementById("root");
if (element) createRoot(element).render(<RouterProvider router={router} />);
