import { Link, useParams } from "react-router-dom";
import "./welcome.component.css"

export const Welcome = () => {
  const { name } = useParams();

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Welcome, {name}!</h1>
      <p>You are logged in.</p>

      <div style={{ marginTop: "20px" }}>
        <Link to="/projects">
          <button>Go to Projects</button>
        </Link>
      </div>
    </div>
  );
};