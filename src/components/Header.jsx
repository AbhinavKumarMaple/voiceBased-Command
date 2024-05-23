import logo from "../assets/logo.png";

const Header = () => {
  return (
    <div style={{ textAlign: "center" }}>
      <img src={logo} style={{ width: 300, flex: 1, alignItems: "center" }} />
    </div>
  );
};

export default Header;
