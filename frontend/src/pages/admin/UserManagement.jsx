// import { useFetchData } from "6pp";
// import { Avatar, Skeleton } from "@mui/material";
// import React, { useEffect, useState } from "react";
// import AdminLayout from "../../components/layout/AdminLayout";
// import Table from "../../components/shared/Table";
// import { server } from "../../constants/config";
// import { useErrors } from "../../hooks/hook";
// import { transformImage } from "../../lib/features";

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
// ];
// const UserManagement = () => {
//   const { loading, data, error } = useFetchData(
//     `${server}/api/v1/admin/users`,
//     "dashboard-users"
//   );

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


const UserManagement = () => {

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


  
  return (
    <AdminLayout>
      {loading ? (
        <Skeleton height={"100vh"} />
      ) : (
        <Table heading={"All Users"} columns={columns} rows={rows} />
      )}
    </AdminLayout>
  );
};

export default UserManagement;