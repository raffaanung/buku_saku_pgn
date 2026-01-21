<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Buku Saku PGN</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    <style>
        [x-cloak] { display: none !important; }
    </style>
</head>
<body class="bg-slate-50 text-slate-800 h-screen overflow-hidden flex" x-data="{ sidebarOpen: true, dropdownOpen: false, notificationOpen: false, hasUnread: true }">

    <!-- Sidebar -->
    <aside 
        class="bg-slate-900 text-white transition-all duration-300 ease-in-out flex flex-col z-30"
        :class="sidebarOpen ? 'w-64' : 'w-20'"
    >
        <!-- Sidebar Header -->
        <div class="h-16 flex items-center justify-between px-4 border-b border-slate-800 shrink-0">
            <span class="font-bold text-lg tracking-wider text-blue-400 whitespace-nowrap overflow-hidden transition-opacity duration-300"
                  :class="sidebarOpen ? 'opacity-100' : 'opacity-0 w-0 hidden'">
                BUKU SAKU
            </span>
            <span class="font-bold text-xl text-blue-400 mx-auto" :class="sidebarOpen ? 'hidden' : 'block'">
                BS
            </span>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 px-2 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
            
            @php
                $role = session('user')['role'] ?? 'user';
                $isAdmin = in_array($role, ['admin', 'manager', 'superuser']);
            @endphp

            <!-- Beranda (All Roles) -->
            <a href="{{ route('dashboard') }}" 
               class="flex items-center px-3 py-2 rounded-md transition-all duration-200 group relative {{ request()->routeIs('dashboard') ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white' }}">
                <span class="flex items-center justify-center w-6 h-6 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                </span>
                <span class="ml-3 whitespace-nowrap transition-opacity duration-300" :class="sidebarOpen ? 'opacity-100' : 'opacity-0 w-0 hidden'">Beranda</span>
                <div class="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none" :class="sidebarOpen ? 'hidden' : 'block'">
                    Beranda
                </div>
            </a>

            @if($isAdmin)
                <!-- Upload File -->
                <a href="{{ route('upload') }}" 
                   class="flex items-center px-3 py-2 rounded-md transition-all duration-200 group relative {{ request()->routeIs('upload') ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white' }}">
                    <span class="flex items-center justify-center w-6 h-6 shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    </span>
                    <span class="ml-3 whitespace-nowrap transition-opacity duration-300" :class="sidebarOpen ? 'opacity-100' : 'opacity-0 w-0 hidden'">Upload File</span>
                    <div class="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none" :class="sidebarOpen ? 'hidden' : 'block'">
                        Upload File
                    </div>
                </a>

                <!-- Hapus File -->
                <a href="{{ route('delete_file') }}" 
                   class="flex items-center px-3 py-2 rounded-md transition-all duration-200 group relative {{ request()->routeIs('delete_file') ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white' }}">
                    <span class="flex items-center justify-center w-6 h-6 shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </span>
                    <span class="ml-3 whitespace-nowrap transition-opacity duration-300" :class="sidebarOpen ? 'opacity-100' : 'opacity-0 w-0 hidden'">Hapus File</span>
                    <div class="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none" :class="sidebarOpen ? 'hidden' : 'block'">
                        Hapus File
                    </div>
                </a>

                <!-- Cek File -->
                <a href="{{ route('check_file') }}" 
                   class="flex items-center px-3 py-2 rounded-md transition-all duration-200 group relative {{ request()->routeIs('check_file') ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white' }}">
                    <span class="flex items-center justify-center w-6 h-6 shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </span>
                    <span class="ml-3 whitespace-nowrap transition-opacity duration-300" :class="sidebarOpen ? 'opacity-100' : 'opacity-0 w-0 hidden'">Cek File</span>
                    <div class="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none" :class="sidebarOpen ? 'hidden' : 'block'">
                        Cek File
                    </div>
                </a>

                <!-- Riwayat Masukkan -->
                <a href="{{ route('history') }}" 
                   class="flex items-center px-3 py-2 rounded-md transition-all duration-200 group relative {{ request()->routeIs('history') ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white' }}">
                    <span class="flex items-center justify-center w-6 h-6 shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </span>
                    <span class="ml-3 whitespace-nowrap transition-opacity duration-300" :class="sidebarOpen ? 'opacity-100' : 'opacity-0 w-0 hidden'">Riwayat Masukkan</span>
                    <div class="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none" :class="sidebarOpen ? 'hidden' : 'block'">
                        Riwayat Masukkan
                    </div>
                </a>
            @else
                <!-- User Sidebar -->
                <!-- Riwayat File -->
                <a href="{{ route('history') }}" 
                   class="flex items-center px-3 py-2 rounded-md transition-all duration-200 group relative {{ request()->routeIs('history') ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white' }}">
                    <span class="flex items-center justify-center w-6 h-6 shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    </span>
                    <span class="ml-3 whitespace-nowrap transition-opacity duration-300" :class="sidebarOpen ? 'opacity-100' : 'opacity-0 w-0 hidden'">Riwayat File</span>
                    <div class="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none" :class="sidebarOpen ? 'hidden' : 'block'">
                        Riwayat File
                    </div>
                </a>
                

            @endif
        </nav>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col h-screen overflow-hidden">
        
        <!-- Header -->
        <header class="bg-white shadow-sm border-b px-6 py-3 flex justify-between items-center shrink-0 z-20">
            <div class="flex items-center gap-3">
                <button @click="sidebarOpen = !sidebarOpen" class="text-slate-500 hover:text-slate-700 focus:outline-none p-1 rounded hover:bg-slate-100">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </div>

            <div class="flex items-center gap-4">
                <!-- Notifications -->
                <div class="relative">
                    <button @click="notificationOpen = !notificationOpen" @click.outside="notificationOpen = false" class="relative p-2 text-slate-400 hover:text-blue-600 transition-colors focus:outline-none" title="Notifikasi">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <!-- Badge Notification -->
                        <span x-show="hasUnread" class="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white animate-pulse"></span>
                    </button>

                    <!-- Notification Dropdown -->
                    <div x-show="notificationOpen" 
                         x-transition:enter="transition ease-out duration-100"
                         x-transition:enter-start="transform opacity-0 scale-95"
                         x-transition:enter-end="transform opacity-100 scale-100"
                         x-transition:leave="transition ease-in duration-75"
                         x-transition:leave-start="transform opacity-100 scale-100"
                         x-transition:leave-end="transform opacity-0 scale-95"
                         class="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border border-slate-100 ring-1 ring-black ring-opacity-5 z-50 overflow-hidden"
                         style="display: none;">
                        
                        <div class="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <span class="font-semibold text-slate-700 text-sm">Notifikasi</span>
                            <button @click="hasUnread = false" class="text-xs text-blue-600 hover:underline cursor-pointer focus:outline-none">Tandai semua dibaca</button>
                        </div>

                        <div class="max-h-96 overflow-y-auto">
                            <!-- Mock Notification Items -->
                            <div class="px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer">
                                <div class="flex items-start gap-3">
                                    <div class="bg-blue-100 text-blue-600 p-1.5 rounded-full shrink-0 mt-0.5">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p class="text-sm text-slate-800 font-medium">Dokumen Baru Diunggah</p>
                                        <p class="text-xs text-slate-500 mt-0.5">Dokumen "Prosedur Las Pipa 2024" menunggu persetujuan Anda.</p>
                                        <p class="text-[10px] text-slate-400 mt-1">10 menit yang lalu</p>
                                    </div>
                                </div>
                            </div>

                            <div class="px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer">
                                <div class="flex items-start gap-3">
                                    <div class="bg-green-100 text-green-600 p-1.5 rounded-full shrink-0 mt-0.5">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p class="text-sm text-slate-800 font-medium">Dokumen Disetujui</p>
                                        <p class="text-xs text-slate-500 mt-0.5">Dokumen "Panduan K3 Umum" telah disetujui oleh Admin.</p>
                                        <p class="text-[10px] text-slate-400 mt-1">1 jam yang lalu</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer">
                                <div class="flex items-start gap-3">
                                    <div class="bg-red-100 text-red-600 p-1.5 rounded-full shrink-0 mt-0.5">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p class="text-sm text-slate-800 font-medium">Dokumen Ditolak</p>
                                        <p class="text-xs text-slate-500 mt-0.5">Pengajuan "Laporan Bulanan" ditolak. Alasan: Format tidak sesuai.</p>
                                        <p class="text-[10px] text-slate-400 mt-1">Kemarin</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- User Profile -->
                <div class="relative">
                    <button @click="dropdownOpen = !dropdownOpen" @click.outside="dropdownOpen = false" class="flex items-center space-x-3 focus:outline-none">
                        <div class="text-right hidden md:block">
                            <div class="text-sm font-semibold text-slate-800">{{ session('user')['name'] ?? 'User' }}</div>
                            <div class="text-xs text-slate-500 capitalize">{{ session('user')['role'] ?? 'Guest' }}</div>
                        </div>
                        <div class="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-md">
                            {{ substr(session('user')['name'] ?? 'U', 0, 1) }}
                        </div>
                    </button>

                    <!-- Dropdown -->
                    <div x-show="dropdownOpen" 
                         x-transition:enter="transition ease-out duration-100"
                         x-transition:enter-start="transform opacity-0 scale-95"
                         x-transition:enter-end="transform opacity-100 scale-100"
                         x-transition:leave="transition ease-in duration-75"
                         x-transition:leave-start="transform opacity-100 scale-100"
                         x-transition:leave-end="transform opacity-0 scale-95"
                         class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 border ring-1 ring-black ring-opacity-5"
                         style="display: none;">
                        <form action="{{ route('logout') }}" method="POST">
                            @csrf
                            <button type="submit" class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Logout</button>
                        </form>
                    </div>
                </div>
            </div>
        </header>

        <!-- Page Content -->
        <main class="flex-1 overflow-auto bg-slate-50 p-6">
            @if(session('error'))
                <div class="bg-red-100 text-red-700 p-4 rounded mb-4 border-l-4 border-red-500 shadow-sm">
                    {{ session('error') }}
                </div>
            @endif
            @if(session('success'))
                <div class="bg-green-100 text-green-700 p-4 rounded mb-4 border-l-4 border-green-500 shadow-sm">
                    {{ session('success') }}
                </div>
            @endif

            @yield('content')
        </main>
    </div>

</body>
</html>
