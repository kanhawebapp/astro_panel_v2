import styles from '@/app/UI/features/Waitlist/waitlist.module.css'
const waitlistData = [
  {
    name: 'Komal',
    id: 825,
    country: 'INDIA',
    type: 'Call',
    tokenNo: 1,
    duration: '7 mins',
    status: 'Waiting',
  },
  {
    name: 'John',
    id: 826,
    country: 'USA',
    type: 'Call',
    tokenNo: 2,
    duration: '5 mins',
    status: 'Waiting',
  },
  {
    name: 'Alice',
    id: 827,
    country: 'CANADA',
    type: 'Call',
    tokenNo: 3,
    duration: '8 mins',
    status: 'Waiting',
  },
  {
    name: 'Bob',
    id: 828,
    country: 'UK',
    type: 'Call',
    tokenNo: 4,
    duration: '2 mins',
    status: 'Waiting',
  },
];

const Waitlist = () => {
  return (
    <div className={`${styles["card-panel-permi"]} flex items-center justify-center flex-col md:mx-16 md:me-12`}>
      <h2 className="wallet-head text-center">Waitlist</h2>

      <div className={`${styles["astro-main-wait"]} flex justify-between flex-wrap`}>
        {waitlistData.map((item, index) => (
          <div key={index} className={`lg:w-1/4  ${styles["panel-access-box"]} ${styles["panel-waitlist"]} flex justify-between flex-col`}>
            <div className={`${styles["sp-off"]}  flex flex-wrap justify-between flex-col`}>
              <div className={`${styles["sp-waiting"]} flex justify-between`}>
                <span className={`${styles["p-a-t"]} flex`}>
                  <span className={`${styles["p-a-type"]}`}>
                    {item.name} (ID : {item.id})
                  </span>
                </span>
                <span className={`${styles["p-a-t"]} flex items-center`}>
                  <h3 className={`${styles["top-greet"]} mb-0`}>{item.country}</h3>
                </span>
              </div>
              <div className={`${styles["sp-waiting"]} flex justify-between`}>
                <span className={`${styles["p-a-t"]} flex items-center`}>
                  <span className={`${styles["p-a-type"]}`}>Type : </span>
                  <h3 className={`${styles["top-greet"]} mb-0`}>{item.type}</h3>
                </span>
                <span className={`${styles["p-a-t"]} flex items-center`}>
                  <span className={`${styles["p-a-type"]}`}>Token No :</span>
                  <h3 className={`${styles["top-greet"]} mb-0`}>{item.tokenNo}</h3>
                </span>
              </div>
              <div className={`${styles["sp-waiting"]} flex justify-between`}>
                <span className={`${styles["p-a-t"]} flex items-center`}>
                  <span className={`${styles["p-a-type"]}`}>Duration :</span>
                  <h3 className={`${styles["top-greet"]} mb-0`}>{item.duration}</h3>
                </span>
              </div>
            </div>
            <span className={`${styles["p-a-t"]} flex items-center`}>
              <span className={`${styles["p-a-type"]}`}>Status : </span>
              <span className={`${styles["st-wait"]} bg-warning`}>{item.status}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Waitlist;
