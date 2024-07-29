"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { format, isPast } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LoginLink } from "@kinde-oss/kinde-auth-nextjs/components";
import AlertMessage from "./AlertMessage";

import { useRouter } from "next/navigation";

const postData = async (url: string, data: object) => {
  const options = {
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };
  try {
    const res = await fetch(url, options);
    const data = await res.json();
    return data;
  } catch (error) {
    console.log(error);
  }
};

const Reservation = ({
  reservations,
  room,
  isUserAuthenticated,
  userData,
}: {
  reservations: any;
  room: any;
  isUserAuthenticated: boolean;
  userData: any;
}) => {
  const [checkInDate, setCheckInDate] = useState<Date>();
  const [checkOutDate, setCheckOutDate] = useState<Date>();
  const [alertMessage, setAlertMessage] = useState<{
    message: string;
    type: "error" | "success" | null;
  } | null>(null);

  const router=useRouter();

  const formatDateForStrapi = (data: Date) => {
    return format(data, "yyyy-MM-dd");
  };

  useEffect(() => {
    const timer = setTimeout(() => {
    return  setAlertMessage(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [alertMessage]);

  const saveReservation = () => {
    if (!checkInDate || !checkOutDate) {
      return setAlertMessage({
        message: "please check-in and check-out dates",
        type: "error",
      });
    }
    if (checkInDate.getTime() === checkOutDate.getTime()) {
      return setAlertMessage({
        message: "Check-in and check-out dates cannot be the same",
        type: "error",
      });
    }

    const isReserved = reservations.data
      .filter((item: any) => item.attributes.room.data.id === room.data.id)
      .some((item: any) => {
        const existingCheckIn = new Date(item.attributes.checkin).setHours(
          0,
          0,
          0,
          0
        );
        const existingCheckOut = new Date(item.attributes.checkout).setHours(
          0,
          0,
          0,
          0
        );
        const checkInTime = checkInDate.setHours(0, 0, 0, 0);

        const checkOutTime = checkOutDate.setHours(0, 0, 0, 0);

        const isReservedBetweenDates =
          (checkInTime >= existingCheckIn && checkInTime < existingCheckOut) ||
          (checkOutTime > existingCheckIn &&
            checkOutTime <= existingCheckOut) ||
          (existingCheckIn > checkInTime && existingCheckIn < checkOutTime) ||
          (existingCheckOut > checkInTime && existingCheckOut <= checkOutTime);
          return isReservedBetweenDates
      });
   
       
     if(isReserved){
      setAlertMessage({
        message:'this room is already booked for the selected dates. please choose different dates or another room.',
        type:'error'
      })
     }else{
      const data = {
        data: {
          firstname: userData.given_name,
          lastname: userData.family_name,
          email: userData.email,
          checkin: checkInDate ? formatDateForStrapi(checkInDate) : null,
          checkout: checkOutDate ? formatDateForStrapi(checkOutDate) : null,
          room: room.data.id,
        },
      };
      // post booking data to the server
      postData("http://127.0.0.1:1337/api/reservations", data);
      setAlertMessage({
        message:'Your booking has been successfully',
        type:'success'
      })
      router.refresh();
    };

     }

   

  return (
    <div>
      <div className="bg-tertiary h-[320px] mb-4">
        {/* top */}
        <div className="bg-accent py-4 text-center relative mb-2">
          <h4 className="text-xl text-white">Book Your Room</h4>
          {/* triangle */}
          <div
            className="absolute -bottom-[8px] left-[calc(50%_-_10px)] w-0 h-0
        border-l-[10px] border-transparent border-t-[8px] border-t-accent
        border-r-[10px] border-r-transparent"
          ></div>
        </div>
        <div className="flex flex-col gap-4 w-full py-6 px-8">
          {/* check in */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="default"
                size="md"
                className={cn(
                  "w-full flex justify-start text-left font-semibold",
                  !checkInDate && "text-secondary"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {checkInDate ? (
                  format(checkInDate, "PPP")
                ) : (
                  <span>Check in</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={checkInDate}
                onSelect={setCheckInDate}
                initialFocus
                disabled={isPast}
              />
            </PopoverContent>
          </Popover>

          {/* check out */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="default"
                size="md"
                className={cn(
                  "w-full flex justify-start text-left font-semibold",
                  !checkOutDate && "text-secondary"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {checkOutDate ? (
                  format(checkOutDate, "PPP")
                ) : (
                  <span>Check out</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={checkOutDate}
                onSelect={setCheckOutDate}
                initialFocus
                disabled={isPast}
              />
            </PopoverContent>
          </Popover>

          {/* conditional rendering of the booking button */}

          {isUserAuthenticated ? (
            <Button onClick={() => saveReservation()} size="md">
              Book now
            </Button>
          ) : (
            <LoginLink>
              <Button className="w-full" size="md">
                Book now
              </Button>
            </LoginLink>
          )}
        </div>
        {alertMessage && (
          <AlertMessage
            message={alertMessage.message}
            type={alertMessage.type}
          />
        )}
      </div>
    </div>
  );
};

export default Reservation;
