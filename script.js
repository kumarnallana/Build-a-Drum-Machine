/* ==========================================================================
   PRO-BEAT X900 // CYBERPUNK MPC DRUM MACHINE ENGINE
   ========================================================================== */

(() => {
    // DOM Elements
    const drumMachine = document.querySelector('#drum-machine');
    const displayEL = document.querySelector('#display');
    const padBankEL = document.querySelector('#pad-bank');
    const powerToggle = document.querySelector('#power-toggle');
    const powerStatusText = document.querySelector('#power-status-text');
    const bankToggle = document.querySelector('#bank-toggle');
    const bankLabel = document.querySelector('#bank-label');
    const bankModeBadge = document.querySelector('#bank-mode-badge');
    const volumeSlider = document.querySelector('#volume-slider');
    const volumeValDisplay = document.querySelector('#volume-val-display');
    const visualizerBars = document.querySelectorAll('.eq-bar');

    // State
    let isPoweredOn = true;
    let currentKit = 1;
    let currentVolume = 0.8;
    let clearDisplayTimeout = null;

    // Sound Kits Data
    const soundKits = {
        1: {
            name: 'HEATER CLASSIC',
            sounds: {
                Q: { name: 'Heater 1', src: 'https://cdn.freecodecamp.org/curriculum/drum/Heater-1.mp3' },
                W: { name: 'Heater 2', src: 'https://cdn.freecodecamp.org/curriculum/drum/Heater-2.mp3' },
                E: { name: 'Heater 3', src: 'https://cdn.freecodecamp.org/curriculum/drum/Heater-3.mp3' },
                A: { name: 'Heater 4', src: 'https://cdn.freecodecamp.org/curriculum/drum/Heater-4_1.mp3' },
                S: { name: 'Clap', src: 'https://cdn.freecodecamp.org/curriculum/drum/Heater-6.mp3' },
                D: { name: 'Open-HH', src: 'https://cdn.freecodecamp.org/curriculum/drum/Dsc_Oh.mp3' },
                Z: { name: "Kick-n'-Hat", src: 'https://cdn.freecodecamp.org/curriculum/drum/Kick_n_Hat.mp3' },
                X: { name: 'Kick', src: 'https://cdn.freecodecamp.org/curriculum/drum/RP4_KICK_1.mp3' },
                C: { name: 'Closed-HH', src: 'https://cdn.freecodecamp.org/curriculum/drum/Cev_H2.mp3' }
            }
        },
        2: {
            name: 'SMOOTH SYNTH KIT',
            sounds: {
                Q: { name: 'Chord 1', src: 'https://s3.amazonaws.com/freecodecamp/drums/Chord_1.mp3' },
                W: { name: 'Chord 2', src: 'https://s3.amazonaws.com/freecodecamp/drums/Chord_2.mp3' },
                E: { name: 'Chord 3', src: 'https://s3.amazonaws.com/freecodecamp/drums/Chord_3.mp3' },
                A: { name: 'Shaker', src: 'https://s3.amazonaws.com/freecodecamp/drums/Give_us_a_light.mp3' },
                S: { name: 'Open-HH', src: 'https://s3.amazonaws.com/freecodecamp/drums/Dry_Ohh.mp3' },
                D: { name: 'Closed-HH', src: 'https://s3.amazonaws.com/freecodecamp/drums/Bld_H1.mp3' },
                Z: { name: 'Punchy Kick', src: 'https://s3.amazonaws.com/freecodecamp/drums/punchy_kick_1.mp3' },
                X: { name: 'Side Stick', src: 'https://s3.amazonaws.com/freecodecamp/drums/side_stick_1.mp3' },
                C: { name: 'Snare', src: 'https://s3.amazonaws.com/freecodecamp/drums/Brk_Snr.mp3' }
            }
        }
    };

    // Apply Initial Volume to all audio clips
    const updateAllAudioVolume = (vol) => {
        const audios = document.querySelectorAll('audio.clip');
        audios.forEach(audio => {
            audio.volume = vol;
        });
    };
    updateAllAudioVolume(currentVolume);

    // Dynamic Visualizer Animation Trigger
    const triggerVisualizerPulse = () => {
        visualizerBars.forEach(bar => {
            const randomHeight = Math.floor(Math.random() * 18) + 4;
            bar.style.height = `${randomHeight}px`;
            bar.classList.add('active');
        });

        setTimeout(() => {
            visualizerBars.forEach(bar => {
                bar.style.height = '4px';
                bar.classList.remove('active');
            });
        }, 220);
    };

    // Audio Playback Handler
    const playDrumPad = (drumPadEL) => {
        if (!isPoweredOn || !drumPadEL) return;

        const audioEL = drumPadEL.querySelector('audio');
        if (!audioEL) return;

        // Reset and play
        audioEL.currentTime = 0;
        audioEL.volume = currentVolume;
        
        const playPromise = audioEL.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.warn('Audio playback error:', error);
            });
        }

        // Visual feedback on pad
        drumPadEL.classList.add('active');
        setTimeout(() => {
            drumPadEL.classList.remove('active');
        }, 120);

        // Update display text
        const drumName = drumPadEL.dataset.drumName || 'Clip';
        displayEL.textContent = drumName;

        // Animate visualizer
        triggerVisualizerPulse();
    };

    // Click handler for Pad Bank
    const onPadBankClick = (ev) => {
        if (!isPoweredOn) return;
        const drumPadEL = ev.target.closest('.drum-pad');
        if (drumPadEL) {
            playDrumPad(drumPadEL);
        }
    };

    // Keyboard Keydown handler
    const onKeydown = (ev) => {
        if (!isPoweredOn) return;
        
        // Ignore modifier keys or form inputs if any
        if (ev.target.tagName === 'INPUT' && ev.target.type !== 'checkbox') return;

        const key = ev.key.toUpperCase();
        const drumPadEL = padBankEL.querySelector(`.drum-pad#drum-pad-${key}`);

        if (drumPadEL) {
            ev.preventDefault();
            playDrumPad(drumPadEL);
        }
    };

    // Power Toggle Handler
    const onPowerChange = () => {
        isPoweredOn = powerToggle.checked;
        if (isPoweredOn) {
            drumMachine.classList.remove('power-off');
            powerStatusText.textContent = 'ONLINE';
            displayEL.textContent = 'READY';
        } else {
            drumMachine.classList.add('power-off');
            powerStatusText.textContent = 'OFFLINE';
            displayEL.textContent = '';
        }
    };

    // Sound Kit Switcher
    const switchSoundKit = (kitId) => {
        currentKit = kitId;
        const kit = soundKits[kitId];
        
        if (bankLabel) {
            bankLabel.textContent = `KIT: ${kit.name}`;
        }
        if (bankModeBadge) {
            bankModeBadge.textContent = `KIT ${kitId}`;
        }

        // Update all pads in DOM
        Object.keys(kit.sounds).forEach(keyLetter => {
            const pad = padBankEL.querySelector(`.drum-pad#drum-pad-${keyLetter}`);
            if (pad) {
                const sound = kit.sounds[keyLetter];
                pad.dataset.drumName = sound.name;
                
                const label = pad.querySelector('.pad-sound-label');
                if (label) {
                    label.textContent = sound.name;
                }

                const audio = pad.querySelector('audio');
                if (audio) {
                    audio.src = sound.src;
                    audio.load();
                }
            }
        });

        if (isPoweredOn) {
            displayEL.textContent = kit.name;
            triggerVisualizerPulse();
        }
    };

    const onBankToggleChange = () => {
        const nextKit = bankToggle.checked ? 2 : 1;
        switchSoundKit(nextKit);
    };

    // Volume Slider Handler
    const onVolumeChange = (ev) => {
        const val = parseInt(ev.target.value, 10);
        currentVolume = val / 100;
        updateAllAudioVolume(currentVolume);
        
        volumeValDisplay.textContent = `${val}%`;

        if (isPoweredOn) {
            displayEL.textContent = `VOLUME: ${val}%`;

            if (clearDisplayTimeout) clearTimeout(clearDisplayTimeout);
            clearDisplayTimeout = setTimeout(() => {
                if (isPoweredOn && displayEL.textContent === `VOLUME: ${val}%`) {
                    displayEL.textContent = soundKits[currentKit].name;
                }
            }, 1200);
        }
    };

    // Register Event Listeners
    padBankEL.addEventListener('click', onPadBankClick);
    document.addEventListener('keydown', onKeydown);
    powerToggle.addEventListener('change', onPowerChange);
    bankToggle.addEventListener('change', onBankToggleChange);
    volumeSlider.addEventListener('input', onVolumeChange);

    // Initial message
    displayEL.textContent = 'READY';
})();
