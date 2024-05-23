import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import {
  BrowserRouter,
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import Products from './Products';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
 { path:"/products",
  element:<Products/>}
]);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <RouterProvider router={router} />
  </BrowserRouter>
);

reportWebVitals();

