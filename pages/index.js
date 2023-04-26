import { Menu, Transition } from "@headlessui/react";
import { DotsVerticalIcon } from "@heroicons/react/outline";
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, } from "@heroicons/react/solid";
import {
  add, eachDayOfInterval, endOfMonth, format,
  getDay, isEqual, isSameDay, isSameMonth,
  isToday, parse, parseISO, startOfToday,
} from "date-fns";
import { Fragment, useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";

import Navbar from '../components/navbar';
import ModalConfirm from "../components/confirm";
import apiHandle from "../lib/api";
import cookieHandle from "../lib/cookie";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Calendar() {
  const today = startOfToday();
  const [selectedDay, setSelectedDay] = useState(today);
  const [currentMonth, setCurrentMonth] = useState(format(today, "yyyy-MM"));
  const firstDayCurrentMonth = parse(currentMonth, "yyyy-MM", new Date());

  const days = eachDayOfInterval({
    start: firstDayCurrentMonth,
    end: endOfMonth(firstDayCurrentMonth),
  });

  /* <캘린더 업데이트> */
  function previousMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: -1 });
    setCurrentMonth(format(firstDayNextMonth, "yyyy-MM"));
  }

  function nextMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: 1 });
    setCurrentMonth(format(firstDayNextMonth, "yyyy-MM"));
  }
  /* </캘린더 업데이트> */

  /* <스케쥴 입력 폼> */

  const modalType = {
    ADD: "addSchedule",
    MODIFY: "modifySchedule",
    DELETE: "deleteSchedule"
  }

  const [alert, setAlert] = useState(false);
  const [confirmType, setConfirmType] = useState("");
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmContent, setConfirmContent] = useState("");
  const [confirmButton, setConfirmButton] = useState("");
  const [confirmItem, setConfirmItem] = useState([]);
  const [confirmCalendarID, setConfirmCalendarID] = useState("");

  const clickModal = {
    check: (calendarID, title, s_date, e_date, content) => {
      setAlert(false);
      if (confirmType == modalType.ADD) // 추가
        addSchedule(title, format(s_date, "yyyy-MM-dd"), format(e_date, "yyyy-MM-dd"), content);
      if (confirmType == modalType.MODIFY) // 수정
        modifyCalendar(calendarID, title, format(s_date, "yyyy-MM-dd"), format(e_date, "yyyy-MM-dd"), content);
      if (confirmType == modalType.DELETE) // 삭제
        deleteCalendar(calendarID)
      setIsUpdate(!isUpdate);
    },
    cancel: () => {
      setAlert(false);
    },
  };
  /* </스케쥴 입력 폼> */

  /* <요청 함수 폼> */
  const [isUpdate, setIsUpdate] = useState(false);
  async function requestSchduleForm({ method, url, data }) {
    try {
      const response = await apiHandle(method, url, data, cookieHandle.get("AUT")?.token);
      const loadData = response.data;
      if (loadData.isError) toast.error(loadData.message, { autoClose: 1500 });
      else toast.success(loadData.message, { autoClose: 1500 });
    } catch (err) {
      toast.error("서버와의 연결이 끊겼습니다.", { autoClose: 1500 });
    }
  }
  /* </요청 함수 폼> */

  /* <스케쥴 추가 요청> */
  const addSchedule = (title, s_date, e_date, content) => {
    requestSchduleForm({
      method: "POST",
      url: "/calendar/addCalendar",
      data: { title, s_date, e_date, content }
    })
  };
  /* </스케쥴 추가 요청> */

  /* <스케쥴 수정 요청> */
  const modifyCalendar = (calendarID, title, s_date, e_date, content) => {
    requestSchduleForm({
      method: "PUT",
      url: "/calendar/modifyCalendar",
      data: { calendarID, title, s_date, e_date, content }
    })
  };
  /* </스케쥴 수정 요청> */

  /* <스케쥴 삭제 요청> */
  const deleteCalendar = (calendarID) => {
    requestSchduleForm({
      method: "DELETE",
      url: "/calendar/deleteCalendar",
      data: { calendarID }
    })
  };
  /* </스케쥴 삭제 요청> */

  /* <스케쥴 렌더링> */
  const [schedules, setSchedules] = useState([]);

  async function viewSchedule(targetDate) {
    try {
      const response = await apiHandle("GET", `/calendar/viewCalendar?targetDate=${targetDate}`);
      const loadData = response.data;
      setSchedules(loadData.rows);
    } catch (err) {
      console.log(err);
      toast.error("서버와의 연결이 끊겼습니다.", { autoClose: 1500 });
    }
  }
  useEffect(() => {
    viewSchedule(currentMonth);
    console.log("Updated")
  }, [isUpdate, currentMonth]);

  const selectedDaySchedules = schedules.filter((schedule) =>
    isSameDay(parseISO(schedule?.sDate), selectedDay)
  );
  /* </스케쥴 렌더링> */

  return (
    <>
      <Navbar />
      <ToastContainer />
      {alert && <ModalConfirm calendarID={confirmCalendarID} modalData={{ confirmTitle, confirmContent, confirmButton }} modalClickAction={clickModal} selectedDay={selectedDay} showItem={confirmItem} />}
      <div className="px-2 pt-16">
        <div className="mx-auto max-w-md px-4 sm:px-7 md:max-w-4xl md:px-6">
          <div className="md:grid md:grid-cols-2 md:divide-x md:divide-gray-200">
            <div className="md:pr-14">
              <div className="flex items-center px-2">
                <h2 className="flex-auto font-semibold text-gray-900">
                  {format(firstDayCurrentMonth, "MMMM yyyy")}
                </h2>
                <button
                  type="button"
                  onClick={previousMonth}
                  className="-my-1.5 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Previous month</span>
                  <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  onClick={nextMonth}
                  type="button"
                  className="-my-1.5 -mr-1.5 ml-2 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Next month</span>
                  <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <div className="mt-10 grid grid-cols-7 text-center text-xs leading-6 text-gray-500">
                <div>S</div>
                <div>M</div>
                <div>T</div>
                <div>W</div>
                <div>T</div>
                <div>F</div>
                <div>S</div>
              </div>
              <div className="mt-2 grid grid-cols-7 text-sm">
                {days.map((day, dayIdx) => (
                  <div
                    key={day.toString()}
                    className={classNames(
                      dayIdx === 0 && colStartClasses[getDay(day)],
                      "py-1.5"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedDay(day)}
                      className={classNames(
                        isEqual(day, selectedDay) && "text-white",
                        !isEqual(day, selectedDay) &&
                        isToday(day) &&
                        "text-red-500",
                        !isEqual(day, selectedDay) &&
                        !isToday(day) &&
                        isSameMonth(day, firstDayCurrentMonth) &&
                        "text-gray-900",
                        !isEqual(day, selectedDay) &&
                        !isToday(day) &&
                        !isSameMonth(day, firstDayCurrentMonth) &&
                        "text-gray-400",
                        isEqual(day, selectedDay) &&
                        isToday(day) &&
                        "bg-red-500",
                        isEqual(day, selectedDay) &&
                        !isToday(day) &&
                        "bg-gray-900",
                        !isEqual(day, selectedDay) && "hover:bg-gray-200",
                        (isEqual(day, selectedDay) || isToday(day)) &&
                        "font-semibold",
                        "mx-auto flex h-8 w-8 items-center justify-center rounded-full"
                      )}
                    >
                      <time dateTime={format(day, "yyyy-MM-dd")}>
                        {format(day, "d")}
                      </time>
                    </button>

                    <div className="mx-auto mt-1 h-1 w-1">
                      {schedules.some((schedule) =>
                        isSameDay(parseISO(schedule?.sDate), day)
                      ) && (
                          <div className="h-1 w-1 rounded-full bg-sky-500"></div>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <section className="mt-12 md:mt-0 md:pl-14">
              <div className="flex items-center px-2">
                <h2 className="flex-auto font-semibold text-gray-900">
                  <time dateTime={format(selectedDay, "yyyy-MM-dd")}>
                    {format(selectedDay, "yyyy년 M월 dd일 일정이에요 :-)")}
                  </time>
                </h2>
                <button
                  type="button"
                  className="-my-1.5 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
                  onClick={() => {
                    setConfirmType(modalType.ADD);
                    setConfirmTitle("일정 추가하기");
                    setConfirmContent("등록하신 일정은 웅도 캘린더에 저장되어 학우들과 선생님 모두에게 보여질 예정입니다. 나중에 일정을 삭제하거나 수정할 수 있습니다.");
                    setConfirmButton("추가");
                    setConfirmItem([true, true, true, true]);
                    setAlert(true);
                  }}
                >
                  <span className="sr-only">Add Schedule</span>
                  <PlusIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <ol className="mt-4 space-y-1 text-sm leading-6 text-gray-500">
                {selectedDaySchedules.length > 0 ? (
                  selectedDaySchedules.map((schedule) => (
                    <li
                      key={schedule.calendarID}
                      id={schedule.calendarID}
                      className="group flex items-center space-x-4 rounded-xl px-4 py-2 focus-within:bg-gray-100 hover:bg-gray-100"
                    >
                      <div className="flex-auto">
                        <p className="text-gray-900">{schedule.title}</p>
                        <p className="mt-0.5">
                          {schedule.userName} ({schedule.userID})
                        </p>
                      </div>
                      <Menu
                        as="div"
                        className="relative opacity-0 focus-within:opacity-100 group-hover:opacity-100"
                      >
                        <div>
                          <Menu.Button className="-m-2 flex items-center rounded-full p-1.5 text-gray-500 hover:text-gray-600">
                            <span className="sr-only">Options</span>
                            <DotsVerticalIcon className="h-6 w-6" aria-hidden="true" />
                          </Menu.Button>
                        </div>

                        <Transition
                          as={Fragment}
                          enter="transition ease-out duration-100"
                          enterFrom="transform opacity-0 scale-95"
                          enterTo="transform opacity-100 scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="transform opacity-100 scale-100"
                          leaveTo="transform opacity-0 scale-95"
                        >
                          <Menu.Items className="absolute right-0 z-10 mt-2 w-36 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                            <div className="py-1">
                              <Menu.Item>
                                <a
                                  onClick={() => {
                                    setConfirmType(modalType.MODIFY);
                                    setConfirmTitle("일정 수정하기");
                                    setConfirmContent("등록하신 일정은 웅도 캘린더에 저장되어 학우들과 선생님 모두에게 보여질 예정입니다. 나중에 일정을 삭제하거나 수정할 수 있습니다.");
                                    setConfirmButton("수정");
                                    setConfirmItem([true, true, true, true]);
                                    setConfirmCalendarID(schedule.calendarID);
                                    setAlert(true);
                                  }}
                                  className="cursor-pointer text-gray-700 block px-4 py-2 text-sm"
                                >
                                  Edit
                                </a>
                              </Menu.Item>
                              <Menu.Item>
                                <a
                                  onClick={() => {
                                    setConfirmType(modalType.DELETE);
                                    setConfirmTitle("일정 삭제하기");
                                    setConfirmContent("정말 삭제하시겠습니까? 일정 삭제 처리 후에는 일정을 복원할 수 없습니다.");
                                    setConfirmButton("삭제");
                                    setConfirmItem([false, false, false, false]);
                                    setConfirmCalendarID(schedule.calendarID);
                                    setAlert(true);
                                  }}
                                  className="cursor-pointer text-gray-700 block px-4 py-2 text-sm"
                                >
                                  Delete
                                </a>
                              </Menu.Item>
                              <Menu.Item>
                                <a className="cursor-pointer text-gray-700 block px-4 py-2 text-sm">
                                  Cancel
                                </a>
                              </Menu.Item>
                            </div>
                          </Menu.Items>
                        </Transition>
                      </Menu>
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-2">
                    <p>등록된 일정이 없습니다.</p>
                  </li>
                )}
              </ol>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}

const colStartClasses = [
  "",
  "col-start-2",
  "col-start-3",
  "col-start-4",
  "col-start-5",
  "col-start-6",
  "col-start-7",
];
