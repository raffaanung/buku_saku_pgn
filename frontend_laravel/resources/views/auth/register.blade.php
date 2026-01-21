@extends('layouts.guest')

@section('content')
<div class="flex min-h-screen w-full" x-data="registerForm()">
    <!-- Left Side - Branding -->
    <div class="hidden lg:flex lg:w-1/2 bg-blue-900 text-white flex-col justify-between p-12 relative overflow-hidden">
        <!-- Background Pattern (Abstract) -->
        <div class="absolute inset-0 opacity-10">
            <svg class="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M0 100 C 20 0 50 0 100 100 Z" fill="currentColor" />
            </svg>
        </div>

        <div class="relative z-10">
            <div class="flex items-center gap-3 mb-6">
                <!-- PGN Logo Placeholder -->
                <div class="bg-white text-blue-900 font-bold p-2 rounded text-xl tracking-tighter">
                    PGN
                </div>
                <span class="font-medium text-lg opacity-90">Pertamina Gas Negara</span>
            </div>
            
            <h1 class="text-5xl font-bold leading-tight mb-6">
                Buku Saku <br>
                <span class="text-blue-300">Digital</span>
            </h1>
            
            <p class="text-lg text-blue-200 max-w-md">
                Bergabunglah untuk mengakses standar prosedur, instruksi kerja, dan panduan keselamatan kerja di lingkungan PGN.
            </p>
        </div>

        <div class="relative z-10 text-sm text-blue-300">
            &copy; {{ date('Y') }} PT Perusahaan Gas Negara Tbk. All rights reserved.
        </div>
    </div>

    <!-- Right Side - Register Form -->
    <div class="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white overflow-y-auto">
        <div class="w-full max-w-md space-y-6">
            <div class="text-center lg:text-left">
                <h2 class="text-3xl font-bold text-slate-900">Buat Akun Baru</h2>
                <p class="mt-2 text-slate-600">Pilih peran Anda untuk mendaftar.</p>
            </div>

            @if(session('error'))
                <div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-r">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                            </svg>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm text-red-700">{{ session('error') }}</p>
                        </div>
                    </div>
                </div>
            @endif

            <!-- Role Toggle -->
            <div class="bg-slate-100 p-1 rounded-lg flex">
                <button type="button" 
                    @click="setRole('admin')"
                    :class="{'bg-white text-blue-600 shadow-sm': role === 'admin', 'text-slate-500 hover:text-slate-700': role !== 'admin'}"
                    class="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200">
                    Admin
                </button>
                <button type="button" 
                    @click="setRole('user')"
                    :class="{'bg-white text-blue-600 shadow-sm': role === 'user', 'text-slate-500 hover:text-slate-700': role !== 'user'}"
                    class="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200">
                    Pengguna
                </button>
            </div>

            <form action="{{ route('register.post') }}" method="POST" class="space-y-4" @submit.prevent="validateAndSubmit">
                @csrf
                <input type="hidden" name="role" :value="role">

                <!-- Admin Fields -->
                <template x-if="role === 'admin'">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-slate-700">Username</label>
                            <input type="text" name="username" required class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700">Jabatan</label>
                            <input type="text" name="jabatan" required class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                        </div>
                         <div>
                            <label class="block text-sm font-medium text-slate-700">Pass Key (Admin Only)</label>
                            <input type="password" name="passkey" required class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                        </div>
                    </div>
                </template>

                <!-- User Fields -->
                <template x-if="role === 'user'">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-slate-700">Nama Instansi</label>
                            <input type="text" name="nama_instansi" required class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700">Nama Pengguna</label>
                            <input type="text" name="nama_pengguna" required class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700">Alamat</label>
                            <textarea name="alamat" required class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"></textarea>
                        </div>
                    </div>
                </template>

                <!-- Common Fields -->
                <div>
                    <label class="block text-sm font-medium text-slate-700" x-text="role === 'user' ? 'Email Pengaju' : 'Email'"></label>
                    <input type="email" name="email" x-model="email" @blur="validateEmail" required 
                        class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        :class="{'border-red-500': errors.email}">
                    <p x-show="errors.email" class="mt-1 text-xs text-red-600" x-text="errors.email"></p>
                </div>

                <div>
                    <label class="block text-sm font-medium text-slate-700">Password</label>
                    <input type="password" name="password" x-model="password" @blur="validatePassword" required 
                        class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        :class="{'border-red-500': errors.password}">
                    <p x-show="errors.password" class="mt-1 text-xs text-red-600" x-text="errors.password"></p>
                </div>

                <div>
                    <label class="block text-sm font-medium text-slate-700">Konfirmasi Password</label>
                    <input type="password" name="password_confirmation" x-model="password_confirmation" @blur="validateConfirmPassword" required 
                        class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        :class="{'border-red-500': errors.password_confirmation}">
                    <p x-show="errors.password_confirmation" class="mt-1 text-xs text-red-600" x-text="errors.password_confirmation"></p>
                </div>

                <div class="pt-4">
                    <button type="submit" class="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                        Continue
                    </button>
                </div>
            </form>
            
            <p class="mt-2 text-center text-sm text-slate-600">
                Sudah memiliki akun? 
                <a href="{{ route('login') }}" class="font-medium text-blue-600 hover:text-blue-500">Login disini</a>
            </p>
        </div>
    </div>
</div>

<script>
    function registerForm() {
        return {
            role: 'admin',
            email: '',
            password: '',
            password_confirmation: '',
            errors: {},

            setRole(role) {
                this.role = role;
                this.errors = {}; // Reset errors on toggle
            },

            validateEmail() {
                const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!this.email) {
                    this.errors.email = 'Email wajib diisi';
                } else if (!re.test(this.email)) {
                    this.errors.email = 'Format email tidak valid';
                } else {
                    delete this.errors.email;
                }
            },

            validatePassword() {
                if (!this.password) {
                    this.errors.password = 'Password wajib diisi';
                } else if (this.password.length < 8) {
                    this.errors.password = 'Password minimal 8 karakter';
                } else {
                    delete this.errors.password;
                }
            },

            validateConfirmPassword() {
                if (this.password !== this.password_confirmation) {
                    this.errors.password_confirmation = 'Konfirmasi password tidak cocok';
                } else {
                    delete this.errors.password_confirmation;
                }
            },

            validateAndSubmit(e) {
                this.validateEmail();
                this.validatePassword();
                this.validateConfirmPassword();

                if (Object.keys(this.errors).length > 0) {
                    return; // Stop submission
                }
                
                // Submit form natively
                e.target.submit();
            }
        }
    }
</script>
@endsection
