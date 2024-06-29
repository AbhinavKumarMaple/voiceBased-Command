import logo from "../assets/logo.png";

const Header = () => {
  return (
    <>
    <div style={{ textAlign: "center", fontSize:"30px", fontFamily:"n", backgroundColor: "#b7c9db", padding: "2px 0" }}>
      <div>Inventory Management using voice</div>
      <img src={logo} style={{ width: 150, flex: 1, alignItems: "center" }} />
    </div>
    </>
  );
};

export default Header;
