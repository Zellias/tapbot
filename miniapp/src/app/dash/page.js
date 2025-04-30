"use client"
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trash2, Plus } from 'react-feather';
import { useRouter } from 'next/navigation';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const Dashboard = () => {
    const router = useRouter();
    const [users, setUsers] = useState([]);
    const [payments, setPayments] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [taskStats, setTaskStats] = useState({
        labels: [],
        data: []
    });
    const [activeTab, setActiveTab] = useState('overview');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [pagination, setPagination] = useState({});
    const [showAddTaskModal, setShowAddTaskModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        reward: 0,
        link: '',
        type: 'channel',
        value: 'none'
    });

    useEffect(() => {
        const validateToken = async () => {
            setLoading(true);
            const token = localStorage.getItem('token');

            if (!token) {
                router.push('/login');
                return;
            }

            try {
                const response = await fetch('/api/auth/validate', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    localStorage.removeItem('token');
                    router.push('/login');
                    return;
                }

                await fetchData();
                await fetchTaskStats();
            } catch (error) {
                console.error('Error validating token:', error);
                router.push('/login');
            } finally {
                setLoading(false);
            }
        };

        validateToken();
    }, [activeTab, search, page, router]);

    const fetchTaskStats = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch('/api/admin/donetasks', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();

            // Process done tasks into stats
            const tasksByDate = data.doneTasks.reduce((acc, task) => {
                const date = new Date(task.createdAt).toLocaleDateString();
                acc[date] = (acc[date] || 0) + 1;
                return acc;
            }, {});

            const labels = Object.keys(tasksByDate);
            const values = Object.values(tasksByDate);

            setTaskStats({
                labels,
                data: values
            });
        } catch (error) {
            console.error('Error fetching task stats:', error);
        }
    };

    const chartData = {
        labels: taskStats.labels,
        datasets: [
            {
                label: 'وظایف انجام شده',
                data: taskStats.data,
                fill: true,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.4,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                pointBackgroundColor: 'rgb(75, 192, 192)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgb(75, 192, 192)',
                shadowColor: 'rgba(0, 0, 0, 0.5)',
                shadowBlur: 10,
                shadowOffsetX: 5,
                shadowOffsetY: 5
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                labels: {
                    color: '#fff'
                }
            },
            title: {
                display: true,
                text: 'آمار وظایف انجام شده',
                color: '#fff'
            }
        },
        scales: {
            y: {
                ticks: { color: '#fff' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' }
            },
            x: {
                ticks: { color: '#fff' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' }
            }
        }
    };

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        const searchParams = new URLSearchParams({
            search,
            page: page.toString(),
            limit: limit.toString()
        });

        try {
            let response, data;

            switch (activeTab) {
                case 'users':
                    response = await fetch(`/api/admin/users?${searchParams}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    data = await response.json();
                    setUsers(data.users);
                    setPagination(data.pagination);
                    break;
                case 'payments':
                    response = await fetch(`/api/admin/payments?${searchParams}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    data = await response.json();
                    setPayments(data.payments);
                    setPagination(data.pagination);
                    break;
                case 'tasks':
                    response = await fetch(`/api/admin/tasks?${searchParams}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    data = await response.json();
                    setTasks(data.tasks);
                    setPagination(data.pagination);
                    break;
                default:
                    // For overview, fetch all with minimal data
                    const [usersRes, paymentsRes, tasksRes] = await Promise.all([
                        fetch('/api/admin/users?limit=100', {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        }),
                        fetch('/api/admin/payments?limit=100', {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        }),
                        fetch('/api/admin/tasks?limit=100', {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        })
                    ]);
                    const [usersData, paymentsData, tasksData] = await Promise.all([
                        usersRes.json(),
                        paymentsRes.json(),
                        tasksRes.json()
                    ]);
                    setUsers(usersData.users);
                    setPayments(paymentsData.payments);
                    setTasks(tasksData.tasks);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const handleAddTask = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch('/api/admin/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newTask)
            });

            if (!response.ok) throw new Error('Failed to add task');

            setShowAddTaskModal(false);
            setNewTask({
                title: '',
                description: '',
                reward: 0,
                link: '',
                type: 'channel',
                value: 'none'
            });
            fetchData();
        } catch (error) {
            console.error('Error adding task:', error);
        }
    };

    const handleDeleteTask = async (taskId) => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`/api/admin/tasks/${taskId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to delete task');

            fetchData();
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    const renderPagination = () => {
        if (!pagination.pages || activeTab === 'overview') return null;

        return (
            <div className="mt-4 flex justify-center gap-2">
                <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === pagination.pages}
                    className="px-4 py-2 rounded bg-zinc-800 text-white disabled:opacity-50"
                >
                    بعدی
                </button>
                <span className="px-4 py-2 text-white">
                    صفحه {page} از {pagination.pages}
                </span>
                <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="px-4 py-2 rounded bg-zinc-800 text-white disabled:opacity-50"
                >
                    قبلی
                </button>
            </div>
        );
    };

    const renderSearch = () => {
        if (activeTab === 'overview') return null;

        return (
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="جستجو..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                    className="w-full px-4 py-2 rounded bg-zinc-800 text-white border border-zinc-700 placeholder-zinc-400"
                />
            </div>
        );
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            );
        }

        switch (activeTab) {
            case 'users':
                return (
                    <div className="bg-zinc-900 rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-4 text-white">کاربران</h2>
                        {renderSearch()}
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-zinc-800">
                                    <tr>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">شناسه</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">نام</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">امتیاز</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">وظایف انجام شده</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">معرفی‌ها</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">تصویر</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-zinc-900 divide-y divide-zinc-800">
                                    {users.map(user => (
                                        <tr key={user.id} className="hover:bg-zinc-800">
                                            <td className="px-6 py-4 whitespace-nowrap text-white">{user.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-white">{user.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-white">{user.score}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-white">{user.DoneTasks?.length || 0}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-white">
                                                {(user.referralsAsReferrer?.length || 0) + (user.referralsAsReferred?.length || 0)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {renderPagination()}
                    </div>
                );
            case 'payments':
                return (
                    <div className="bg-zinc-900 rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-4 text-white">پرداخت‌ها</h2>
                        {renderSearch()}
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-zinc-800">
                                    <tr>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">شناسه</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">کاربر</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">مبلغ</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">وضعیت</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">تاریخ</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-zinc-900 divide-y divide-zinc-800">
                                    {payments.map(payment => (
                                        <tr key={payment.id} className="hover:bg-zinc-800">
                                            <td className="px-6 py-4 whitespace-nowrap text-white">{payment.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-white">{payment.user?.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-white">{payment.amount} تومان</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 rounded-full text-xs ${payment.status === 'completed' ? 'bg-green-900 text-green-200' :
                                                        payment.status === 'pending' ? 'bg-yellow-900 text-yellow-200' :
                                                            'bg-red-900 text-red-200'
                                                    }`}>
                                                    {payment.status === 'completed' ? 'تکمیل شده' :
                                                        payment.status === 'pending' ? 'در انتظار' : 'ناموفق'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-white">
                                                {new Date(payment.createdAt).toLocaleDateString('fa-IR')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {renderPagination()}
                    </div>
                );
            case 'tasks':
                return (
                    <div className="bg-zinc-900 rounded-lg shadow p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-white">وظایف</h2>
                            <button
                                onClick={() => setShowAddTaskModal(true)}
                                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                <Plus size={20} className="mr-2" />
                                افزودن وظیفه
                            </button>
                        </div>
                        {renderSearch()}
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-zinc-800">
                                    <tr>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">شناسه</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">عنوان</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">توضیحات</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">نوع</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">پاداش</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">تکمیل‌ها</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">عملیات</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-zinc-900 divide-y divide-zinc-800">
                                    {tasks.map(task => (
                                        <tr key={task.id} className="hover:bg-zinc-800">
                                            <td className="px-6 py-4 whitespace-nowrap text-white">{task.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-white">{task.title}</td>
                                            <td className="px-6 py-4 text-white">{task.description}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-white">{task.type}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-white">{task.reward}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-white">{task.DoneTasks?.length || 0}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => handleDeleteTask(task.id)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {renderPagination()}
                    </div>
                );
            default:
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="bg-zinc-900 rounded-lg shadow p-6">
                                <h3 className="text-lg font-semibold mb-2 text-white">کل کاربران</h3>
                                <p className="text-3xl font-bold text-blue-400">{users.length}</p>
                            </div>
                            <div className="bg-zinc-900 rounded-lg shadow p-6">
                                <h3 className="text-lg font-semibold mb-2 text-white">کل پرداخت‌ها</h3>
                                <p className="text-3xl font-bold text-green-400">
                                    {payments.reduce((sum, payment) => sum + (payment.amount || 0), 0)} تومان
                                </p>
                            </div>
                            <div className="bg-zinc-900 rounded-lg shadow p-6">
                                <h3 className="text-lg font-semibold mb-2 text-white">وظایف فعال</h3>
                                <p className="text-3xl font-bold text-purple-400">{tasks.length}</p>
                            </div>
                        </div>

                        <div className="bg-zinc-900 rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold mb-4 text-white">آمار وظایف انجام شده</h3>
                            <div className="h-[400px]">
                                <Line data={chartData} options={chartOptions} />
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="flex h-screen bg-zinc-900" dir="rtl">
            {/* Sidebar */}
            <div className="w-64 bg-zinc-800 shadow-lg">
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-white">داشبورد</h1>
                </div>
                <nav className="mt-6">
                    <div className="px-4 space-y-2">
                        <button
                            onClick={() => {
                                setActiveTab('overview');
                                setSearch('');
                                setPage(1);
                            }}
                            className={`w-full flex items-center px-4 py-2 rounded-lg ${activeTab === 'overview' ? 'bg-blue-600 text-white' : 'text-zinc-300 hover:bg-zinc-700'}`}
                        >
                            <span className="mx-4">نمای کلی</span>
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('users');
                                setSearch('');
                                setPage(1);
                            }}
                            className={`w-full flex items-center px-4 py-2 rounded-lg ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'text-zinc-300 hover:bg-zinc-700'}`}
                        >
                            <span className="mx-4">کاربران</span>
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('payments');
                                setSearch('');
                                setPage(1);
                            }}
                            className={`w-full flex items-center px-4 py-2 rounded-lg ${activeTab === 'payments' ? 'bg-blue-600 text-white' : 'text-zinc-300 hover:bg-zinc-700'}`}
                        >
                            <span className="mx-4">پرداخت‌ها</span>
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('tasks');
                                setSearch('');
                                setPage(1);
                            }}
                            className={`w-full flex items-center px-4 py-2 rounded-lg ${activeTab === 'tasks' ? 'bg-blue-600 text-white' : 'text-zinc-300 hover:bg-zinc-700'}`}
                        >
                            <span className="mx-4">وظایف</span>
                        </button>
                    </div>
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto p-8">
                {renderContent()}
            </div>

            {/* Add Task Modal */}
            {showAddTaskModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-zinc-800 p-6 rounded-lg w-96">
                        <h3 className="text-xl font-semibold mb-4 text-white">افزودن وظیفه جدید</h3>
                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="عنوان"
                                value={newTask.title}
                                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                className="w-full px-4 py-2 rounded bg-zinc-700 text-white"
                            />
                            <textarea
                                placeholder="توضیحات"
                                value={newTask.description}
                                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                className="w-full px-4 py-2 rounded bg-zinc-700 text-white"
                            />
                            <input
                                type="number"
                                placeholder="پاداش"
                                value={newTask.reward}
                                onChange={(e) => setNewTask({ ...newTask, reward: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 rounded bg-zinc-700 text-white"
                            />
                            <input
                                type="text"
                                placeholder="لینک"
                                value={newTask.link}
                                onChange={(e) => setNewTask({ ...newTask, link: e.target.value })}
                                className="w-full px-4 py-2 rounded bg-zinc-700 text-white"
                            />
                            <select
                                value={newTask.type}
                                onChange={(e) => setNewTask({ ...newTask, type: e.target.value })}
                                className="w-full px-4 py-2 rounded bg-zinc-700 text-white"
                            >
                                <option value="channel">کانال</option>
                                <option value="channel">گروه</option>
                                <option value="bot">ربات</option>
                            </select>
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setShowAddTaskModal(false)}
                                    className="px-4 py-2 rounded bg-zinc-600 text-white"
                                >
                                    انصراف
                                </button>
                                <button
                                    onClick={handleAddTask}
                                    className="px-4 py-2 rounded bg-blue-600 text-white"
                                >
                                    افزودن
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
