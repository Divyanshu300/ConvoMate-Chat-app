// import { useFetchData } from "6pp";
// import { Avatar, Skeleton, IconButton} from "@mui/material";
// import React, { useEffect, useState } from "react";
// import AdminLayout from "../../components/layout/AdminLayout";
// import Table from "../../components/shared/Table";
// import { server } from "../../constants/config";
// import { useErrors } from "../../hooks/hook";
// import { transformImage } from "../../lib/features";
// import DeleteIcon from "@mui/icons-material/Delete";
// import axios from "axios";
// import { useDispatch, useSelector } from "react-redux";
// import toast from "react-hot-toast";
// import { userExists } from "../../redux/reducers/auth";
// import Broadcast from "../../components/specific/BroadcastMessage";


// const UserManagement = () => {

//   const [isLoading, setIsLoading] = useState(false);
//   const dispatch = useDispatch()

//   const { loading, data, error } = useFetchData(
//     `${server}/api/v1/admin/users`,
//     "dashboard-users"
//   );


//   const handleDelete = async(userId) => {
//     // Replace with actual delete request
//     if (window.confirm("Are you sure you want to delete this user?")) {    
        
//       const toastId = toast.loading("Deleting user...");
//       setIsLoading(true);

//       const axiosInstance = axios.create({
//         baseURL: `${server}`, // Replace with your API base URL
//         withCredentials: true, // Ensure cookies are included in requests
//       });

//       try {

//         const newData = await axiosInstance.delete(
//           '/api/v1/admin/users/deleteUser', 
//           {
//             data: {
//               'userId':userId
//             },
//           }
//         )
//         // console.log()
//         toast.success(newData?.data?.message, {
//           id: toastId,
//         });

//         if (newData?.data?.success) {
//           setRows((prevRows) => prevRows.filter((row) => row.id !== userId));
//           // dispatch(userExists(newData?.data?.data))
//         }

//       }
//       catch (error) {
//           console.log(error);
//           toast.error(error?.response?.data?.message || "Something Went Wrong", {
//           id: toastId,
//         });
//       }
//       finally {
//         setIsLoading(false);
//       }
//     }; 
//   };

  
// const columns = [
//   {
//     field: "id",
//     headerName: "ID",
//     headerClassName: "table-header",
//     width: 200,
//   },
//   {
//     field: "avatar",
//     headerName: "Avatar",
//     headerClassName: "table-header",
//     width: 150,
//     renderCell: (params) => (
//       <Avatar alt={params.row.name} src={params.row.avatar} />
//     ),
//   },

//   {
//     field: "name",
//     headerName: "Name",
//     headerClassName: "table-header",
//     width: 200,
//   },
//   {
//     field: "username",
//     headerName: "Username",
//     headerClassName: "table-header",
//     width: 200,
//   },
//   {
//     field: "friends",
//     headerName: "Friends",
//     headerClassName: "table-header",
//     width: 150,
//   },
//   {
//     field: "groups",
//     headerName: "Groups",
//     headerClassName: "table-header",
//     width: 200,
//   },
//   {
//     field: "delete",
//     headerName: "Delete",
//     headerClassName: "table-header",
//     width: 100,
//     renderCell: (params) => (
//       <IconButton
//         onClick={() => handleDelete(params.row.id)}
//       >
//         <DeleteIcon />
//       </IconButton>
//     ),
//   }
// ];

//   useErrors([
//     {
//       isError: error,
//       error: error,
//     },
//   ]);

//   const [rows, setRows] = useState([]);

//   useEffect(() => {
//     if (data) {
//       setRows(
//         data.users.map((i) => ({
//           ...i,
//           id: i._id,
//           avatar: transformImage(i.avatar, 50),
//         }))
//       );
//     }
//   }, [data]);


  
//   return (
//     <AdminLayout>
//       {loading ? (
//         <Skeleton height={"100vh"} />
//       ) : (
//         <Table heading={"All Users"} columns={columns} rows={rows} />
//       )}
//     </AdminLayout>
//   );
// };

// export default UserManagement;



import { useFetchData } from "6pp";
import { Avatar, Skeleton, IconButton} from "@mui/material";
import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import Table from "../../components/shared/Table";
import { server } from "../../constants/config";
import { useErrors } from "../../hooks/hook";
import { transformImage } from "../../lib/features";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { userExists } from "../../redux/reducers/auth";
import { getSocket } from "../../socket";
import { NEW_MESSAGE } from "../../constants/events";
import { useChatDetailsQuery } from "../../redux/api/api";
import Broadcast from "../../components/specific/BroadcastMessage";


// import StarIcon from "@mui/icons-material/Star";
// import StarOutlineIcon from "@mui/icons-material/StarOutline";



const UserManagement = () => {

  const {user, isAdmin} = useSelector((state) => state.auth);
  // console.log("text",user);

  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch()

  const { loading, data, error } = useFetchData(
    `${server}/api/v1/admin/users`,
    "dashboard-users"
  );


  const handleDelete = async(userId) => {
    // Replace with actual delete request
    if (window.confirm("Are you sure you want to delete this user?")) {    
        
      const toastId = toast.loading("Deleting user...");
      setIsLoading(true);

      const axiosInstance = axios.create({
        baseURL: `${server}`, // Replace with your API base URL
        withCredentials: true, // Ensure cookies are included in requests
      });

      try {

        const newData = await axiosInstance.delete(
          '/api/v1/admin/users/deleteUser', 
          {
            data: {
              'userId':userId
            },
          }
        )
        // console.log()
        toast.success(newData?.data?.message, {
          id: toastId,
        });

        if (newData?.data?.success) {
          setRows((prevRows) => prevRows.filter((row) => row.id !== userId));
          // dispatch(userExists(newData?.data?.data))
        }

      }
      catch (error) {
          console.log(error);
          toast.error(error?.response?.data?.message || "Something Went Wrong", {
          id: toastId,
        });
      }
      finally {
        setIsLoading(false);
      }
    }; 
  };



  // const handleToggleAdmin = async (userId) => {
  //   const toastId = toast.loading("Updating admin privileges...");
  //   setIsLoading(true);

  //   try {
  //     const response = await axios.patch(
  //       ${server}/api/v1/admin/users/toggleAdmin,
  //       {
  //         userId: userId,
  //       }
  //     );

  //     toast.success(response?.data?.message, {
  //       id: toastId,
  //     });

  //     // Optionally, update the user list after toggling admin privileges
  //   } catch (error) {
  //     console.error(error);
  //     toast.error(
  //       error?.response?.data?.message || "Something Went Wrong",
  //       {
  //         id: toastId,
  //       }
  //     );
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };



  // const handleToggleAdmin = async (userId) => {
  //   try {
  //     setIsLoading(true);
  //     const response = await toggleAdmin(userId); // Call the toggleAdmin API endpoint
  //     toast.success(response.data.message);
  //   } catch (error) {
  //     console.error("Error toggling admin status:", error);
  //     toast.error("Failed to toggle admin status");
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  
const columns = [
  {
    field: "id",
    headerName: "ID",
    headerClassName: "table-header",
    width: 200,
  },
  {
    field: "avatar",
    headerName: "Avatar",
    headerClassName: "table-header",
    width: 150,
    renderCell: (params) => (
      <Avatar alt={params.row.name} src={params.row.avatar} />
    ),
  },

  {
    field: "name",
    headerName: "Name",
    headerClassName: "table-header",
    width: 200,
  },
  {
    field: "username",
    headerName: "Username",
    headerClassName: "table-header",
    width: 200,
  },


  // {
  //   field: "toggleAdmin",
  //   headerName: "Admin",
  //   headerClassName: "table-header",
  //   width: 120,
  //   renderCell: (params) => (
  //     <IconButton
  //       onClick={() => handleToggleAdmin(params.row.id)}
  //       disabled={isLoading}
  //     >
  //       {params.row.isAdmin ? "Remove Admin" : "Make Admin"}
  //     </IconButton>
  //   ),
  // },

  {
    field: "friends",
    headerName: "Friends",
    headerClassName: "table-header",
    width: 150,
  },
  {
    field: "groups",
    headerName: "Groups",
    headerClassName: "table-header",
    width: 200,
  },
  {
    field: "delete",
    headerName: "Delete",
    headerClassName: "table-header",
    width: 100,
    renderCell: (params) => (
      <IconButton
        onClick={() => handleDelete(params.row.id)}
      >
        <DeleteIcon />
      </IconButton>
    ),
  }
];

  useErrors([
    {
      isError: error,
      error: error,
    },
  ]);

  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (data) {
      setRows(
        data.users.map((i) => ({
          ...i,
          id: i._id,
          avatar: transformImage(i.avatar, 50),
        }))
      );
    }
  }, [data]);



  // // new added
  // const [message, setMessage] = useState("");
  // const socket = getSocket();

  // const messageOnChange = (e) => {
  //   setMessage(e.target.value);

  //   console.log(message)
  // }


  // const submitHandler = (e) => {
  //   e.preventDefault();

  //   if (!message.trim()) return;

  //   // Emitting the message to the server
  //   let admin = user._id;
    

  //   for(let i = 0 ; i < data.users.length ; i++) {
  //     const members = [data?.users[i] , admin];
  //     socket.emit(NEW_MESSAGE, { uuid, members, message });
  //   }


  //   setMessage("");

  // }
  
  return (
    <AdminLayout>
      {loading ? (
        <Skeleton height={"100vh"} />
      ) : (
        <div className="relative">
          <Table heading={"All Users"} columns={columns} rows={rows} />
          <Broadcast/>
        </div>
      )}
    </AdminLayout>
  );
};

export default UserManagement;