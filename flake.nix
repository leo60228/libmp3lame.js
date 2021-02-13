{
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-20.09";
  inputs.flake-utils.url = "github:numtide/flake-utils";

  outputs = { nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in rec {
        packages = {
          lame = (pkgs.lame.override {
            nasmSupport = false;
            nasm = null;
            cpmlSupport = false;
            analyzerHooksSupport = false;
            decoderSupport = false;
            frontendSupport = false;
            stdenv = pkgs.emscriptenStdenv;
          }).overrideAttrs (oldAttrs: {
            configurePhase = ''
            HOME=$TMPDIR/home
            export EM_CACHE=$TMPDIR/cache

            runHook preConfigure

            emconfigure ./configure --prefix=$out $configureFlags CFLAGS=-O2

            runHook postConfigure
            '';
            postBuild = ''
            pushd libmp3lame/.libs/
            emcc -O2 ./libmp3lame.so -o ./libmp3lame.js -s ALLOW_MEMORY_GROWTH=1 -s MALLOC=emmalloc -s MODULARIZE=1 -s EXPORT_ES6=1
            popd
            '';
            outputs = [ "out" ];
            installPhase = ''
            mkdir -p $out/lib
            cp libmp3lame/.libs/*.js libmp3lame/.libs/*.wasm $out/lib/
            '';
            doCheck = false;
          });
        };
        devShell = pkgs.mkShell {
          nativeBuildInputs = with pkgs; [ nodejs-14_x ];
        };
      }
    );
}
