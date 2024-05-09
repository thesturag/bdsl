import { useRef } from "react";
import { useEffect } from "react";

function WebcamView(props) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = props.stream;
    }
  }, [props.stream]);

  return (
    <div>
      <video ref={videoRef} autoPlay width={320} height={240} />
    </div>
  );
}

export default WebcamView;