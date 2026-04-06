import React from 'react'
import Lottie from 'lottie-react'
import loader from '../../assets/Loader.json'
// import scanning from '../../assets/Scanning.json'
// import plus_loader from '../../assets/pulse loader.json'

const Loader = ({ size = 150 }) => {

    const styles = {
        container: {
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
        }
    }
  return (
    <div style={styles.container}>
        <Lottie 
           animationData={loader}
           loop={true}
           style={{width: size, height: size}}
        
        />



    </div>
  )
}

export default Loader