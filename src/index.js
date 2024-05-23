import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import Products from './Products';
import Header from './components/Header';
import Footer from './components/Footer';

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
  <div style={{height:'100vh', alignItems:'center', width:'100%',alignContent:'space-between', justifyItems:'center'}}>
    <div>

    <Header/>
    </div>

    <RouterProvider router={router} />
    {/* <Footer/> */}
  </div>
);

reportWebVitals();

